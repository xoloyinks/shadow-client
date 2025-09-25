'use client'
import Link from 'next/link'
import React, { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useToast } from "@/components/ui/use-toast"
import { Button } from '@/components/ui/button';
import { FaSpinner } from 'react-icons/fa';


export default function Create() {
  const [shadowId, setShadowId] = useState('');
  const [loading, setLoading] = useState(false);
  const route = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const focus = document.getElementById('createInput');
    focus?.focus();
    localStorage.setItem('shadowId', '');
  }, [])

  const handleShadowId = async(e:any) => {
    e.preventDefault();
     try{
        setLoading(true);
        const checkIfIdExist = await axios.get('https://shadow-server-b7v0.onrender.com/validateId', {
          params: { query: shadowId}
        });

        const response = checkIfIdExist.data;
        if(response){
            localStorage.setItem('shadowId', shadowId);
            toast({
              title: "ID Saved ✔️",
              description: "Set Password for ID.",
            });
            route.push('/create/pass')
        }else{
          toast({
            title: "ID Taken ✖️",
            description: "Try another ID",
          });
          console.log("Id taken")
        }

     }catch(err){
        console.error(err);
     }finally{
        setLoading(false);
     }
  }
  return (
    <>
        <section className='w-screen h-screen bg-black flex flex-col text-white items-center justify-center'>
            <Link className='absolute top-5 ' href='/' >Go back Home</Link>
            <h1 className='mb-5 text-xl'>Create Shadow ID</h1>
            <form action="" className=' w-8/12 flex flex-col gap-3' onSubmit={handleShadowId}>
                <input id='createInput' type="text" className='bg-transparent border-b-2 border-white py-2 tracking-wide w-full focus:outline-none text-center' value={shadowId} onChange={(e: any) => setShadowId(e.target.value)}/>
                <button  className='text-black bg-white px-5 w-32 flex justify-center items-center py-2 mx-auto'>{loading ? <FaSpinner className='animate-spin' /> : "Next"}</button>
            </form>
        </section>
    </>
  )
}
