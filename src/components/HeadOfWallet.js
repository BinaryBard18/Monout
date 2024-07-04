import React,{useContext,useEffect,useState} from "react";
import "../Analysis.css"
import '../Wallets.css';
import AppContext from "../context/AppContext";
import { useParams } from "react-router-dom";
import { collection, getDocs, query,where } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

export default function HeadOfWallet({
    OpenTransactionHistory,
    OpenAnalysis,
    OpenPreferences,
    styleTheBackground
  }){

    const {showAnalysis,showTransaction,showPreferences} = useContext(AppContext);

    const [walletName,setWalletName] = useState('');

    const [open,setOpen] = useState(null);

    const {id} = useParams();

    // useEffect(()=>{
    //     const storedWalletArray = JSON.parse(localStorage.getItem("walletData"));
    //     const filteredArray = storedWalletArray.filter((item)=>item.id===id);
    //     setWalletName(filteredArray[0]?.name);
    // },[])
    
    useEffect(()=>{
        fetchWalletData(id)
    },[id])

    async function fetchWalletData(id){
        try {
            setOpen(true)
            const q = query(collection(db,'wallets'),where('id','==',id));
            const docSnapshot = await getDocs(q);
            if(!docSnapshot.empty){
                const docSnap = docSnapshot.docs[0];
                const itemData = docSnap.data();
                setWalletName(itemData.name);
                localStorage.setItem("currentWallet",JSON.stringify(itemData.name));
                localStorage.setItem("wallet_id",JSON.stringify(id));
                setOpen(null);
            }
        } catch (error) {
            console.log("Error occured : ",error);
            setOpen(null);
        }
    }


    return(
        <>
            <div className='child--div--one'>
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={open}
                >
                    <CircularProgress color="inherit" />
                </Backdrop>
                <div className='wallet-type-history-analytics-settings'>
                    <p className='wallet-type'>{walletName}</p>
                    <div className='history-analytics-settings'> 
                    <i class='bx bx-history' id='icons' style={showTransaction?styleTheBackground:null} onClick={()=>OpenTransactionHistory()}></i>
                    <i class='bx bx-bar-chart' id='icons' style={showAnalysis?styleTheBackground:null} onClick={()=>OpenAnalysis()}></i>
                    <i class='bx bx-cog' id='icons' style={showPreferences?styleTheBackground:null} onClick={()=>OpenPreferences()} ></i>
                    </div>
                </div>
                
            </div>
        </>
    )
}