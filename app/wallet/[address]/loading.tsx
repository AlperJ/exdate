import Skeleton from "@/app/Skeleton";

export default function Loading() {
  return (
    <Skeleton
      columns="140px 140px 110px 80px 120px 110px"
      rows={9}
      caption="Looking up every tokenized stock in this wallet, then what each one has paid and how much of it this wallet held at the time. A large wallet takes about half a minute."
    />
  );
}
