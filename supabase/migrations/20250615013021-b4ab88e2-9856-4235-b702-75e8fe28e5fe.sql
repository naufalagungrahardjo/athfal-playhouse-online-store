
-- Fix Play Kit and Tahsin Class category background colors to valid Tailwind custom color classes

update public.categories
  set bg_color = 'bg-athfal-teal'
where slug = 'play-kit';

update public.categories
  set bg_color = 'bg-athfal-green'
where slug = 'tahsin-class';
