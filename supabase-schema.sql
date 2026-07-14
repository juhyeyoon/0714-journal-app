create table if not exists public.lotto_draws (
  id uuid primary key default gen_random_uuid(),
  numbers int[] not null,
  source text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint lotto_draws_six_numbers check (array_length(numbers, 1) = 6),
  constraint lotto_draws_number_range check (
    numbers <@ array[
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
      31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
      41, 42, 43, 44, 45
    ]
  )
);
