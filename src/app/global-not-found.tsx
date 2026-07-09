// Import global styles and fonts
import '@richaadgigi/stylexui/css/xui.min.css'
import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import Image from 'next/image'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: '404 - Page Not Found',
    description: 'The page you are looking for does not exist.',
}

export default function GlobalNotFound() {
    return (
        <html lang="en" className={inter.className}>
            <body className='xui-font-5 xui-text-white' style={{ backgroundColor: 'var(--ndc-primary)' }}>
                <div className='xui-container xui-py-8'>
                    <div className='xui-d-flex xui-flex-jc-center xui-flex-dir-column xui-flex-ai-center'>
                        <p className='xui-mb--1 xui-opacity-6 xui-font-w-bold'>You look a little lost...</p>
                        <h1 className='xui-font-w-bold xui-font-sz-200 xui-md-font-sz-350'>Ooops! Page not found</h1>
                        <Image src="/458.svg" alt="404" width={458} height={458} className='xui-img-400 xui-mt-2 xui-h-auto' />
                        <a href="/" className='xui-btn xui-btn-white xui-mt-2 xui-bdr-rad-half'>Back to homepage</a>
                    </div>
                </div>
            </body>
        </html>
    )
}