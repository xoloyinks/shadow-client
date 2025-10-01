'use client'
import Link from 'next/link'
import React, { useContext, useEffect, useState } from 'react'
import { UserData } from '../context'
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaSpinner } from 'react-icons/fa';
import { useToast } from "@/components/ui/use-toast"

export default function Join() {
  const [shadowId, setShadowId] = useState('');
  const [loading, setLoading] = useState(false);
  const route = useRouter();
    const { toast } = useToast();
  
  useEffect(() => {
    const focus = document.getElementById('joinInput');
    focus?.focus();
    localStorage.setItem('shadowId', '');
  }, [])

  const handleSubmit = async(e: any) => {
    e.preventDefault();
    try{
      setLoading(true);
      const checkId = await axios.get('https://shadow-server-b7v0.onrender.com/checkId', {
        params: {
          id: shadowId
        }
      });
      const res = checkId.data;
      if(res){
        localStorage.setItem('shadowId', shadowId);
        route.push('/join/pass');
      }else{
        toast({
              title: "Shadow ID Not Found ✖️",
              description: "Enter a valid Shadow ID",
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
        <h1 className='mb-5 text-xl'>Enter Shadow ID</h1>
        <form action="" onSubmit={handleSubmit} className=' w-8/12 flex flex-col gap-3'>
            <input id='joinInput' required type="text" className='bg-transparent border-b-2 border-white py-2 tracking-wide w-full focus:outline-none text-center'  value={shadowId} onChange={(e:any) => setShadowId(e.target.value)}  />
            <button disabled={loading} className='text-black bg-white px-5 py-2 mx-auto w-32 flex justify-center items-center'>{loading ? <FaSpinner className='animate-spin' /> : 'Next'}</button>
        </form>
    </section>
  )
}
