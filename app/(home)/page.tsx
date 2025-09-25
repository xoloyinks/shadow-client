"use client"
import Image from 'next/image'
import Link from 'next/link';
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

let socket: any;
export default function Home() {

  useEffect(() => {
    localStorage.setItem('shadowId', '');
  }, [])

  return (
    <section className='w-screen text-white h-screen bg-black flex flex-col items-center justify-center'>
      <h1 className='text-xl mb-5'>SHADOW</h1>
      <div className='flex flex-col gap-2'>
          <Link className='py-2 px-5 border-2 text-center' href='/create'>Create Shadow</Link>
          <Link href='/join' className='py-2 px-5 border-2 text-center'>Join Shadow</Link>
      </div>
    </section>
  )
}
