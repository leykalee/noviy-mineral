'use client';

import { useState } from 'react';
import type { CatalogFacets, CatalogQuery, FacetValue, ProductFeature } from '@/types';
import { Icon } from '@/components/common/Icon';
import { useCatalogNavigation } from '@/components/catalog/useCatalogNavigation';
import { clearedFilters, hasActiveFilters, toggleListValue } from '@/lib/catalog-query';
import { formatNumber } from '@/lib/format';
import { cx } from '@/lib/cx';

/**
 * Панель фильтров (п.18–19 ТЗ).
 *
 * Фильтры строятся по фасетам, которые сервер посчитал для текущей выборки:
 * значений без товаров в списке нет, у каждого — количество.
 */

function Group({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-border py-4 first:pt-0">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 text-left text-[15px] font-medium"
        >
          {title}
          <Icon
            name="chevron-down"
            size={18}
            className={cx(
              'shrink-0 text-muted-foreground transition-transform duration-[var(--dur-fast)]',
              open && 'rotate-180',
            )}
          />
        </button>
      </h3>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

function CheckboxList({
  values,
  selected,
  onToggle,
  limit = 6,
}: {
  values: FacetValue[];
  selected: string[];
  onToggle: (value: string) => void;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? values : values.slice(0, limit);

  return (
    <div>
      <ul className="space-y-1.5">
        {visible.map((facet) => {
          const checked = selected.includes(facet.value);
          return (
            <li key={facet.value}>
              <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[15px]">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(facet.value)}
                  className="size-4 shrink-0 accent-[var(--brand)]"
                />
                <span className={cx('flex-1', checked && 'font-medium text-brand')}>
                  {facet.label}
                </span>
                <span className="tnum shrink-0 text-[13px] text-muted-foreground">{facet.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {values.length > limit && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[14px] font-medium text-brand hover:underline"
        >
          {expanded ? 'Свернуть' : `Показать все (${values.length})`}
        </button>
      )}
    </div>
  );
}

function ColorList({
  values,
  selected,
  onToggle,
}: {
  values: FacetValue[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {values.map((facet) => {
        const checked = selected.includes(facet.value);
        return (
          <li key={facet.value}>
            <button
              type="button"
              onClick={() => onToggle(facet.value)}
              aria-pressed={checked}
              // цвет дублируется подписью — статус не передаётся только цветом
              className={cx(
                'inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border px-2.5 text-[14px] transition-colors duration-[var(--dur-fast)]',
                checked ? 'border-brand bg-brand-soft text-brand' : 'border-border-strong hover:border-brand',
              )}
            >
              <span
                aria-hidden="true"
                className="size-4 shrink-0 rounded-full border border-border-strong"
                style={{ background: facet.hex }}
              />
              {facet.label}
              <span className="tnum text-[12px] text-muted-foreground">{facet.count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function RangeInputs({
  fromValue,
  toValue,
  min,
  max,
  unit,
  onApply,
  label,
}: {
  fromValue?: number;
  toValue?: number;
  min?: number;
  max?: number;
  unit: string;
  label: string;
  onApply: (from?: number, to?: number) => void;
}) {
  const [from, setFrom] = useState(fromValue?.toString() ?? '');
  const [to, setTo] = useState(toValue?.toString() ?? '');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedFrom = from.trim() === '' ? undefined : Number(from);
    const parsedTo = to.trim() === '' ? undefined : Number(to);
    onApply(
      Number.isFinite(parsedFrom) ? parsedFrom : undefined,
      Number.isFinite(parsedTo) ? parsedTo : undefined,
    );
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <label className="flex-1">
        <span className="sr-only-focusable absolute">{label} от</span>
        <input
          type="number"
          inputMode="numeric"
          value={from}
          min={0}
          onChange={(e) => setFrom(e.target.value)}
          placeholder={min != null ? formatNumber(min) : 'от'}
          className="h-10 w-full rounded-[var(--radius-sm)] border border-border-strong px-3 text-[15px] outline-none focus:border-brand"
        />
      </label>
      <span className="text-muted-foreground" aria-hidden="true">
        —
      </span>
      <label className="flex-1">
        <span className="sr-only-focusable absolute">{label} до</span>
        <input
          type="number"
          inputMode="numeric"
          value={to}
          min={0}
          onChange={(e) => setTo(e.target.value)}
          placeholder={max != null ? formatNumber(max) : 'до'}
          className="h-10 w-full rounded-[var(--radius-sm)] border border-border-strong px-3 text-[15px] outline-none focus:border-brand"
        />
      </label>
      <span className="shrink-0 text-[14px] text-muted-foreground">{unit}</span>
      <button
        type="submit"
        className="h-10 shrink-0 rounded-[var(--radius-sm)] border border-border-strong px-3 text-[14px] font-medium transition-colors duration-[var(--dur-fast)] hover:border-brand hover:text-brand"
      >
        ОК
      </button>
    </form>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[15px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--brand)]"
      />
      <span className={cx(checked && 'font-medium text-brand')}>{label}</span>
    </label>
  );
}

export function Filters({ facets }: { facets: CatalogFacets }) {
  const { query, apply, patch } = useCatalogNavigation();

  const toggle = (key: 'mineral' | 'deposit' | 'country' | 'region' | 'color' | 'feature', value: string) =>
    apply(toggleListValue(query, key, value));

  return (
    <div className="scroll-thin">
      <Group title="Цена, ₽">
        <RangeInputs
          // key сбрасывает поля, когда фильтр меняют извне (чипсы, «Сбросить всё»)
          key={`price-${query.priceFrom ?? ''}-${query.priceTo ?? ''}`}
          label="Цена"
          unit="₽"
          fromValue={query.priceFrom}
          toValue={query.priceTo}
          min={facets.priceMin}
          max={facets.priceMax}
          onApply={(from, to) => patch({ priceFrom: from, priceTo: to })}
        />
      </Group>

      <Group title="Наличие">
        <div className="space-y-1">
          <Switch
            label="Только в наличии"
            checked={Boolean(query.inStock)}
            onChange={(v) => patch({ inStock: v || undefined })}
          />
          <Switch
            label="Новинки"
            checked={Boolean(query.isNew)}
            onChange={(v) => patch({ isNew: v || undefined })}
          />
          <Switch
            label="Со скидкой"
            checked={Boolean(query.onSale)}
            onChange={(v) => patch({ onSale: v || undefined })}
          />
        </div>
      </Group>

      {facets.mineral.length > 0 && (
        <Group title="Минерал">
          <CheckboxList
            values={facets.mineral}
            selected={query.mineral ?? []}
            onToggle={(v) => toggle('mineral', v)}
            limit={8}
          />
        </Group>
      )}

      {facets.color.length > 0 && (
        <Group title="Цвет">
          <ColorList
            values={facets.color}
            selected={query.color ?? []}
            onToggle={(v) => toggle('color', v)}
          />
        </Group>
      )}

      {facets.country.length > 0 && (
        <Group title="Страна">
          <CheckboxList
            values={facets.country}
            selected={query.country ?? []}
            onToggle={(v) => toggle('country', v)}
          />
        </Group>
      )}

      {facets.region.length > 0 && (
        <Group title="Регион" defaultOpen={false}>
          <CheckboxList
            values={facets.region}
            selected={query.region ?? []}
            onToggle={(v) => toggle('region', v)}
          />
        </Group>
      )}

      {facets.deposit.length > 0 && (
        <Group title="Месторождение" defaultOpen={false}>
          <CheckboxList
            values={facets.deposit}
            selected={query.deposit ?? []}
            onToggle={(v) => toggle('deposit', v)}
          />
        </Group>
      )}

      {facets.feature.length > 0 && (
        <Group title="Особенности экземпляра">
          <CheckboxList
            values={facets.feature}
            selected={(query.feature ?? []) as string[]}
            onToggle={(v) => toggle('feature', v as ProductFeature)}
          />
        </Group>
      )}

      <Group title="Размер, мм" defaultOpen={false}>
        <RangeInputs
          key={`size-${query.sizeFrom ?? ''}-${query.sizeTo ?? ''}`}
          label="Размер"
          unit="мм"
          fromValue={query.sizeFrom}
          toValue={query.sizeTo}
          onApply={(from, to) => patch({ sizeFrom: from, sizeTo: to })}
        />
        <p className="mt-2 text-[13px] text-muted-foreground">Наибольший габарит экземпляра.</p>
      </Group>

      <Group title="Вес, г" defaultOpen={false}>
        <RangeInputs
          key={`weight-${query.weightFrom ?? ''}-${query.weightTo ?? ''}`}
          label="Вес"
          unit="г"
          fromValue={query.weightFrom}
          toValue={query.weightTo}
          onApply={(from, to) => patch({ weightFrom: from, weightTo: to })}
        />
      </Group>

      {hasActiveFilters(query) && (
        <button
          type="button"
          onClick={() => apply(clearedFilters(query))}
          className="mt-4 text-[15px] font-medium text-brand hover:underline"
        >
          Сбросить всё
        </button>
      )}
    </div>
  );
}

export function useHasActiveFilters(query: CatalogQuery) {
  return hasActiveFilters(query);
}
