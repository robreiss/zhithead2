import { PropsWithChildren } from "react";

export default function CardHolder(props: PropsWithChildren) {
  return (
    <div className="h-card-height w-card-width relative flex items-center justify-center rounded-lg outline-dashed outline-1 outline-offset-2 outline-zinc-400 md:outline-2">
      {/* <div
      className="w-card-width relative flex items-center justify-center rounded-lg outline-dashed outline-1 outline-offset-2 outline-zinc-400 md:outline-2"
      style={{ height: "var(--card-height)" }}
    > */}
      {props.children}
    </div>
  );
}
