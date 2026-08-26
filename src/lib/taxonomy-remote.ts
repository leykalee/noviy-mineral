import 'server-only';

import type { Category } from '@/types';
import { flattenCategories, getCategories } from '@/lib/admik';

/**
 * Категории витрины — data-driven из Admik (`GET /categories`, дерево slug+name).
 * Витрина не знает категории конкретного магазина в коде (требование
 * универсальности Admik). Здесь — тонкие серверные хелперы поверх API: дерево,
 * плоский список, поиск по slug, дети, путь до корня (для хлебных крошек/меню).
 *
 * Минеральные виды и месторождения как отдельные оси навигации — ЭТАП 2
 * (в каноне Admik таких сущностей нет; сейчас это атрибуты товара).
 */

/** Плоский список всех категорий (с parentId/order). Пустой при ошибке/выкл. */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const tree = await getCategories();
    return flattenCategories(tree);
  } catch {
    return [];
  }
}

/** Категории верхнего уровня (для меню/плиток главной). */
export async function fetchRootCategories(): Promise<Category[]> {
  const all = await fetchCategories();
  return all.filter((c) => !c.parentId).sort((a, b) => a.order - b.order);
}

/** Карта slug → Category по всему дереву. */
async function categoryMap(): Promise<Map<string, Category>> {
  const all = await fetchCategories();
  return new Map(all.map((c) => [c.slug, c]));
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  return (await categoryMap()).get(slug) ?? null;
}

/** Прямые дети категории по slug. */
export async function fetchChildCategories(slug: string): Promise<Category[]> {
  const all = await fetchCategories();
  return all.filter((c) => c.parentId === slug).sort((a, b) => a.order - b.order);
}

/** Путь от корня до категории включительно (для хлебных крошек). */
export async function fetchCategoryPath(slug: string): Promise<Category[]> {
  const map = await categoryMap();
  const path: Category[] = [];
  let cur = map.get(slug) ?? null;
  const guard = new Set<string>();
  while (cur && !guard.has(cur.slug)) {
    guard.add(cur.slug);
    path.unshift(cur);
    cur = cur.parentId ? map.get(cur.parentId) ?? null : null;
  }
  return path;
}
