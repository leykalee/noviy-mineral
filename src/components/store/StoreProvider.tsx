'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { CartItem, FavoriteItem, Order, User } from '@/types';

/**
 * Клиентское состояние покупателя: корзина, избранное, история просмотров, сессия.
 *
 * Без авторизации всё живёт в localStorage (п.32 ТЗ). При входе локальное избранное
 * и корзина СЛИВАЮТСЯ с данными аккаунта, а не затираются — пользователь не должен
 * терять то, что отобрал до входа.
 *
 * Заказы здесь хранятся зеркально, чтобы личный кабинет работал в прототипе.
 * В production источником правды будет БД, а не браузер.
 */

const GUEST_KEY = 'nm.guest.v1';
const accountKey = (email: string) => `nm.account.${email.toLowerCase()}.v1`;
const SESSION_KEY = 'nm.session.v1';

interface PersistedState {
  cart: CartItem[];
  favorites: FavoriteItem[];
  recentlyViewed: string[];
  orders: Order[];
  /**
   * Хранится только код, без суммы скидки: сумма пересчитывается от актуальной
   * корзины, поэтому промокод не «залипает» с устаревшим значением и
   * переносится из корзины в оформление заказа.
   */
  promoCode: string | null;
}

interface StoreState extends PersistedState {
  user: User | null;
  /** false до первого чтения localStorage — не даём UI мигать чужими значениями */
  hydrated: boolean;
}

const emptyState: StoreState = {
  cart: [],
  favorites: [],
  recentlyViewed: [],
  orders: [],
  promoCode: null,
  user: null,
  hydrated: false,
};

type Action =
  | { type: 'hydrate'; payload: Partial<StoreState> }
  | { type: 'cart/add'; productId: string; quantity: number; maxQuantity: number }
  | { type: 'cart/set'; productId: string; quantity: number; maxQuantity: number }
  | { type: 'cart/remove'; productId: string }
  | { type: 'cart/clear' }
  | { type: 'favorites/toggle'; productId: string }
  | { type: 'favorites/remove'; productId: string }
  | { type: 'viewed/push'; productId: string }
  | { type: 'orders/add'; order: Order }
  | { type: 'promo/set'; code: string | null }
  | { type: 'session/login'; user: User; merged: PersistedState }
  | { type: 'session/logout'; guest: PersistedState };

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload, hydrated: true };

    case 'cart/add': {
      const existing = state.cart.find((i) => i.productId === action.productId);
      const nextQty = Math.min(
        (existing?.quantity ?? 0) + action.quantity,
        Math.max(action.maxQuantity, 1),
      );
      const cart = existing
        ? state.cart.map((i) => (i.productId === action.productId ? { ...i, quantity: nextQty } : i))
        : [...state.cart, { productId: action.productId, quantity: nextQty, addedAt: Date.now() }];
      return { ...state, cart };
    }

    case 'cart/set': {
      const quantity = Math.max(1, Math.min(action.quantity, Math.max(action.maxQuantity, 1)));
      return {
        ...state,
        cart: state.cart.map((i) => (i.productId === action.productId ? { ...i, quantity } : i)),
      };
    }

    case 'cart/remove':
      return { ...state, cart: state.cart.filter((i) => i.productId !== action.productId) };

    case 'cart/clear':
      // корзина опустела — промокод к ней больше не относится
      return { ...state, cart: [], promoCode: null };

    case 'favorites/toggle': {
      const exists = state.favorites.some((f) => f.productId === action.productId);
      return {
        ...state,
        favorites: exists
          ? state.favorites.filter((f) => f.productId !== action.productId)
          : [...state.favorites, { productId: action.productId, addedAt: Date.now() }],
      };
    }

    case 'favorites/remove':
      return { ...state, favorites: state.favorites.filter((f) => f.productId !== action.productId) };

    case 'viewed/push': {
      // товар уже во главе истории — новое состояние создавать нельзя,
      // иначе контекст пересоздаётся и эффект просмотра зацикливается
      if (state.recentlyViewed[0] === action.productId) return state;
      return {
        ...state,
        recentlyViewed: [
          action.productId,
          ...state.recentlyViewed.filter((id) => id !== action.productId),
        ].slice(0, 12),
      };
    }

    case 'orders/add':
      return { ...state, orders: [action.order, ...state.orders] };

    case 'promo/set':
      return { ...state, promoCode: action.code };

    case 'session/login':
      return { ...state, user: action.user, ...action.merged };

    case 'session/logout':
      return { ...state, user: null, ...action.guest };

    default:
      return state;
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // приватный режим / переполнение — состояние просто не переживёт перезагрузку
  }
}

const blank: PersistedState = {
  cart: [],
  favorites: [],
  recentlyViewed: [],
  orders: [],
  promoCode: null,
};

/** Слияние гостевых данных с данными аккаунта: ничего не теряем */
function merge(guest: PersistedState, account: PersistedState): PersistedState {
  const favorites = [...account.favorites];
  for (const fav of guest.favorites) {
    if (!favorites.some((f) => f.productId === fav.productId)) favorites.push(fav);
  }
  const cart = [...account.cart];
  for (const item of guest.cart) {
    const existing = cart.find((c) => c.productId === item.productId);
    if (existing) existing.quantity = Math.max(existing.quantity, item.quantity);
    else cart.push(item);
  }
  const recentlyViewed = Array.from(new Set([...guest.recentlyViewed, ...account.recentlyViewed])).slice(0, 12);
  return {
    cart,
    favorites,
    recentlyViewed,
    orders: account.orders,
    promoCode: guest.promoCode ?? account.promoCode,
  };
}

interface StoreContextValue extends StoreState {
  addToCart: (productId: string, quantity?: number, maxQuantity?: number) => void;
  setCartQuantity: (productId: string, quantity: number, maxQuantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  pushViewed: (productId: string) => void;
  addOrder: (order: Order) => void;
  setPromoCode: (code: string | null) => void;
  login: (user: User) => void;
  logout: () => void;
  cartCount: number;
  favoritesCount: number;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, emptyState);

  // первичная загрузка из localStorage
  useEffect(() => {
    const session = readJson<{ user: User | null }>(SESSION_KEY, { user: null });
    const guest = readJson<PersistedState>(GUEST_KEY, blank);
    if (session.user) {
      const account = readJson<PersistedState>(accountKey(session.user.email), blank);
      dispatch({ type: 'hydrate', payload: { ...merge(guest, account), user: session.user } });
    } else {
      dispatch({ type: 'hydrate', payload: guest });
    }
  }, []);

  // сохранение при каждом изменении
  useEffect(() => {
    if (!state.hydrated) return;
    const data: PersistedState = {
      cart: state.cart,
      favorites: state.favorites,
      recentlyViewed: state.recentlyViewed,
      orders: state.orders,
      promoCode: state.promoCode,
    };
    writeJson(state.user ? accountKey(state.user.email) : GUEST_KEY, data);
  }, [
    state.hydrated,
    state.cart,
    state.favorites,
    state.recentlyViewed,
    state.orders,
    state.promoCode,
    state.user,
  ]);

  const login = useCallback((user: User) => {
    const guest = readJson<PersistedState>(GUEST_KEY, blank);
    const account = readJson<PersistedState>(accountKey(user.email), blank);
    const merged = merge(guest, account);
    writeJson(SESSION_KEY, { user });
    writeJson(accountKey(user.email), merged);
    // гостевую корзину очищаем только после успешного переноса
    writeJson(GUEST_KEY, blank);
    dispatch({ type: 'session/login', user, merged });
  }, []);

  const logout = useCallback(() => {
    writeJson(SESSION_KEY, { user: null });
    const guest = readJson<PersistedState>(GUEST_KEY, blank);
    dispatch({ type: 'session/logout', guest });
  }, []);

  const actions = useMemo(
    () => ({
      addToCart: (productId: string, quantity = 1, maxQuantity = 99) =>
        dispatch({ type: 'cart/add' as const, productId, quantity, maxQuantity }),
      setCartQuantity: (productId: string, quantity: number, maxQuantity: number) =>
        dispatch({ type: 'cart/set' as const, productId, quantity, maxQuantity }),
      removeFromCart: (productId: string) => dispatch({ type: 'cart/remove' as const, productId }),
      clearCart: () => dispatch({ type: 'cart/clear' as const }),
      toggleFavorite: (productId: string) => dispatch({ type: 'favorites/toggle' as const, productId }),
      removeFavorite: (productId: string) => dispatch({ type: 'favorites/remove' as const, productId }),
      pushViewed: (productId: string) => dispatch({ type: 'viewed/push' as const, productId }),
      addOrder: (order: Order) => dispatch({ type: 'orders/add' as const, order }),
      setPromoCode: (code: string | null) => dispatch({ type: 'promo/set' as const, code }),
    }),
    // dispatch стабилен, поэтому действия создаются один раз за всё время жизни
    [],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      ...state,
      ...actions,
      isFavorite: (productId: string) => state.favorites.some((f) => f.productId === productId),
      login,
      logout,
      cartCount: state.cart.reduce((sum, i) => sum + i.quantity, 0),
      favoritesCount: state.favorites.length,
    }),
    [state, actions, login, logout],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore должен вызываться внутри StoreProvider');
  return ctx;
}
