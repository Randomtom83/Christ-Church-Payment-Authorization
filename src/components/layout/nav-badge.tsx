type Props = {
  count: number;
};

export function NavBadge({ count }: Props) {
  if (count <= 0) return null;

  return (
    <span
      className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-red-600 text-white text-xs font-bold"
      aria-label={`${count} pending`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
