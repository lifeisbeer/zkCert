import Header from "./header";
import Footer from "./footer";
import { WagmiConfig, createClient } from "wagmi";
import { getDefaultProvider  } from "ethers";

import networks from "../code/networks.json";

const client = createClient({
  autoConnect: true,
  provider: getDefaultProvider(),
});

export default function Layout({ children }) {
    return (
      <>
        <WagmiConfig client={client}>
          <Header />
          <main className="mb-auto">{children}</main>
          <Footer />
        </WagmiConfig>
      </>
    );
  }