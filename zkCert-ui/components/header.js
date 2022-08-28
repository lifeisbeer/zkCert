import Link from "next/link";
import dynamic from "next/dynamic";

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

const ConnectWalletBtn = dynamic(
  () => import("../components/ConnectWalletBtn"),
  {
    ssr: false,
  }
);

export default function Header() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <Link href="/"> zkCert </Link>
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}></Typography>
          <ConnectWalletBtn />
        </Toolbar>
      </AppBar>
    </Box>
  );
}