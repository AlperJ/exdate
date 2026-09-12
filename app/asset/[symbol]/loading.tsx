import Skeleton from "@/app/Skeleton";

export default function Loading() {
  return (
    <Skeleton
      columns="112px 150px 1fr 130px 120px"
      rows={6}
      caption="Reading the mint account on Solana mainnet, then the issuer's payout record and reserve attestation."
    />
  );
}
