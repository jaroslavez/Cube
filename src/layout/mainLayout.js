import Head from "next/head";

export default function MainLayout({children}) {
    return (
        <>
            <Head>
                <title>Куб</title>
                <meta name="description" content="Куууууууууб" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/cube-svgrepo-com.svg" />
            </Head>
            {children}
        </>
    )
}