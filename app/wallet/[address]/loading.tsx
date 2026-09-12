import Skeleton from "@/app/Skeleton";

export default function Loading() {
  return (
    <Skeleton
      columns="140px 140px 110px 80px 120px 110px"
      rows={9}
      caption="Reading every Token-2022 balance in this wallet, then the payout record for each position. Large wallets take a few seconds."
    />
  );
}
