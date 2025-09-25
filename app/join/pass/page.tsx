'use client'
import { UserData } from '@/app/context';
import axios from 'axios';
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import React, { useContext, useEffect, useState } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { FaSpinner } from 'react-icons/fa';

export default function Pass() {
  const [pass, setPass] = useState('');
  const [auth, setAuth] = useContext(UserData);
  const [ loading, setLoading] = useState(false);
  const route = useRouter();
  const { toast } = useToast();
  useEffect(() => {
    const focus = document.getElementById('joinInput');
    focus?.focus();
  }, []);
  const handleSubmit = async(e: any) => {
    e.preventDefault();
    const shadowId = localStorage.getItem('shadowId');
    const user = "shadow" + Math.floor(Math.random() * 100);
    localStorage.setItem('uniqueUser', user);
    try{
      setLoading(true);
      const validate = await axios.get('https://shadow-server-b7v0.onrender.com/validatePass', {
        params:{
          id: shadowId,
          pass: pass 
        }
      });
      const res = validate.data;
      if(res){
        setAuth(true)
        const shadowId = localStorage.getItem('shadowId');
        route.push(`/chat/${shadowId}`);
      }else{
        toast({
          title: "Invalid Password!",
        });
      }

    }catch(err){
      console.error(err);
    }finally{
      setLoading(false);
    }

   
  }
  
  return (
    <section className='w-screen h-screen bg-black flex flex-col text-white items-center justify-center'>
        <Link className='absolute top-5 ' href='/' >Go Back</Link>
        <h1 className='mb-5 text-xl'>Enter Shadow Pass</h1>
        <form action="" onSubmit={handleSubmit} className=' w-8/12 flex flex-col gap-3'>
            <input id='joinInput' type="password" required value={pass} onChange={(e: any) => setPass(e.target.value)}  className='bg-transparent border-b-2 border-white py-2 tracking-wide w-full focus:outline-none text-center' />
            <button className='text-black bg-white px-5 py-2 w-32 flex justify-center items-center mx-auto'>{loading ? <FaSpinner className='animate-spin' /> : "Next"}</button>
        </form>
    </section>
  )
}
