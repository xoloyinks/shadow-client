"use client"
import Link from 'next/link';
import { useEffect } from 'react'
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';


export default function Home() {
  const router = useRouter()

  useEffect(() => {
    localStorage.setItem('shadowId', '');
  }, [])

  const handlePublic = () => {
    const user = "shadow" + Math.floor(Math.random() * 100);
    localStorage.setItem('uniqueUser', user);
    localStorage.setItem('shadowId', 'general');
    router.push('/chat/general');
  }

  return (
    <section className='w-screen text-white h-screen bg-black flex flex-col items-center justify-center'>
      <h1 className='text-xl mb-5'>SHADOW</h1>
      <div className='flex flex-col gap-2'>
          <Link className='py-2 px-5 border-2 text-center' href='/create'>Create Shadow</Link>
          <Link href='/join' className='py-2 px-5 border-2 text-center'>Join Shadow</Link>
          <button onClick={handlePublic} className='py-2 px-5 border-2 text-center'>Join Public Shadow</button>
      </div>
    </section>
  )
}
