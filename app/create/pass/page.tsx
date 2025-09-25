'use client'
import axios from 'axios';
import Link from 'next/link'
import React, { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { UserData } from '@/app/context';
import { useToast } from "@/components/ui/use-toast"
import { FaSpinner } from 'react-icons/fa';

export default function Pass() {
  const [shadowPass, setShadowPass] = useState('');
  const [id, setId] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useContext(UserData);
  const { toast } = useToast();
  const route = useRouter();
  useEffect(() => { 
    const focus = document.getElementById('createInput');
    focus?.focus();
    const id: any = localStorage.getItem('shadowId');
    setId(id);
    localStorage.setItem('uniqueUser', '');
    if(id === ''){
      toast({
        title: "Please, Enter ID first",
      });
      route.push('/create');
    }
  }, [])


  const handleCreation = async(e: any) => {
    e.preventDefault();
    const shadowId = localStorage.getItem('shadowId');
    console.log("shadow id: " + shadowId)
      try{
        setLoading(true);
        const createShadow = await axios.post('https://shadow-server-b7v0.onrender.com/createShadow', {shadowId, shadowPass} );
        const response = createShadow.data;
        
        if(response){
          setAuth(true);
          const user = "shadow" + Math.floor(Math.random() * 100);
          localStorage.setItem('uniqueUser', user);
          route.push(`/chat/${shadowId}`)
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
        <h1 className='mb-5 text-md text-center'>Create Shadow Pass for <br /> <b>{id}</b></h1>
        <form action="" className=' w-8/12 flex flex-col gap-3' onSubmit={handleCreation}>
            <input id='createInput' type="password" className='bg-transparent border-b-2 border-white py-2 tracking-wide w-full focus:outline-none text-center' value={shadowPass} name='shadowPass' onChange={(e) => setShadowPass(e.target.value)} />
            <button  className='text-black bg-white px-5 w-32 flex justify-center items-center py-2 mx-auto'>{loading ? <FaSpinner className='animate-spin' /> : "Next"}</button>
            
        </form>
    </section>
  )
}
