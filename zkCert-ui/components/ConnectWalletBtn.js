import { useAccount, useConnect, useNetwork, useDisconnect } from "wagmi";
import { InjectedConnector } from 'wagmi/connectors/injected'
import Button from '@mui/material/Button';
import { switchNetwork } from "../code/switchNetwork";
import networks from "../code/networks.json";

export default function ConnectWalletBtn() {
  const { address, isConnecting, isConnected, isDisconnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector()
  });
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();

  if (isDisconnected || isConnecting) {
    return (
      <Button 
        color="inherit" 
        onClick={() => connect()}
      >
        Connect Wallet
      </Button>
    );
  } else if (chain.name.slice(6) != networks.selectedChain) {
    return (
      <Button 
        color="inherit" 
        onClick={async () => {
          await switchNetwork();
        }}
      >
        Switch Network
      </Button>
    );
  } else if (isConnected) {
    return (
      <Button 
        color="inherit" 
        onClick={() => disconnect()}
      >
        Disconnect
      </Button>
    );
  }
}