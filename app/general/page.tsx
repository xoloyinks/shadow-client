"use client"
import axios from 'axios';
import Link from 'next/link'
import React, { useState } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation';
import { FaSpinner } from 'react-icons/fa';


export default function Page() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const route = useRouter();

    const handleSubmit = async(e: any) => {
    e.preventDefault();
    try{
      setLoading(true);
    //   const activate = await axios.get('http://localhost:8000/activateServer')
      const activate = await axios.get(`https://${process.env.NEXT_PUBLIC_BACKEND_ENDPOINT}/activateServer`);
      const res = activate.data;
      if(res){
        const user = "shadow" + Math.floor(Math.random() * 100);
        localStorage.setItem('uniqueUser', user);
        localStorage.setItem('shadowId', 'general');
        route.push('/chat/general');
      }else{
        toast({
              title: "Server error ✖️",
              description: "Try Reloading the page",
            });
      }
    }catch(err){
      console.error(err);
    }finally{
      setLoading(false);
    }
  }

   return (
    <section className='sm:w-[30vw] mx-auto h-screen bg-black flex flex-col text-white items-center justify-center'>
        <Link className='absolute top-5 ' href='/' >Go Back Home</Link>
        <h1 className='mb-5 text-xl'>Join General Room</h1>
        <form action="" onSubmit={handleSubmit} className=' w-8/12 flex flex-col gap-3'>
            <button disabled={loading} className='text-black bg-white px-5 py-2 mx-auto w-32 flex justify-center items-center'>{loading ? <FaSpinner className='animate-spin' /> : 'Join'}</button>
        </form>
    </section>
  )
}
