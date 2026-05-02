with matched_products as (
  select
    oi.id,
    p.id as product_db_id,
    p.name as base_product_name,
    p.price as base_price,
    oi.product_name,
    oi.product_price,
    split_part(oi.product_id, '__', 2) as raw_suffix
  from public.order_items oi
  join public.products p
    on p.product_id = split_part(oi.product_id, '__', 1)
  where coalesce(oi.installment_plan_name, '') = ''
), resolved_variant as (
  select
    mp.id,
    coalesce(
      case
        when mp.raw_suffix ~* '^variant_[0-9a-f-]{36}$' then (
          select pv.name
          from public.product_variants pv
          where pv.id = substring(mp.raw_suffix from 9)::uuid
          limit 1
        )
        when mp.raw_suffix ~* '^[0-9a-f-]{36}$' then (
          select pv.name
          from public.product_variants pv
          where pv.id = mp.raw_suffix::uuid
          limit 1
        )
        else null
      end,
      (
        select pv.name
        from public.product_variants pv
        where pv.product_id = mp.product_db_id
          and pv.price = mp.product_price
        order by pv.order_num asc, pv.created_at asc
        limit 1
      ),
      case
        when trim(coalesce(mp.product_name, '')) like trim(coalesce(mp.base_product_name, '')) || ' - %'
          then regexp_replace(trim(mp.product_name), '^' || regexp_replace(trim(mp.base_product_name), '([\\.\[\]\(\)\{\}\+\*\?\^\$\|\\-])', '\\\1', 'g') || '\s*-\s*', '')
        when mp.product_price = mp.base_price then 'Pembayaran Lunas'
        else null
      end
    ) as plan_name
  from matched_products mp
)
update public.order_items oi
set installment_plan_name = rv.plan_name
from resolved_variant rv
where oi.id = rv.id
  and rv.plan_name is not null;