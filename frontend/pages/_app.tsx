import "../styles/globals.css"
import "react-toastify/dist/ReactToastify.css"
import type { AppProps } from "next/app"
import { ToastContainer } from "react-toastify"
import { Layout } from "../components"
import { MarketProvider } from "../context"

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MarketProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <ToastContainer theme="dark" />
    </MarketProvider>
  )
}

export default MyApp
