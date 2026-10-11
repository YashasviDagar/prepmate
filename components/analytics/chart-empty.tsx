export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex h-[260px] items-center justify-center rounded-lg border border-dashed text-sm">
      {message}
    </div>
  );
}
