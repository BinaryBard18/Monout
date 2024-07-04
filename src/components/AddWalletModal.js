import React, { useContext, useState,useEffect } from 'react'
import "../LimitByCategoryModal.css"
import { Box, TextField, MenuItem } from "@mui/material";
import "../AddWalletModal.css"
import '../ReportBug.css';
import { motion,AnimatePresence } from 'framer-motion';
import AppContext from '../context/AppContext';
import { ModalVariant } from './LimitByCategoryModal';
import { doc,getDocs,collection,setDoc } from 'firebase/firestore';
import { db } from '../Firebase/firebase';
import { nanoid } from 'nanoid';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

export default function LimitByCategoryModal() {

    const {setShowAddWallet,uid,setUid} = useContext(AppContext);

     const [showCurrencyInfo,setShowCurrencyInfo] = useState(false);
     const [displayCurrency,setDisplayCurrency] = useState('');

     const [nameError,setNameError] = useState(false);
     const [balanceError,setBalanceError] = useState(false);
     const [showBackDrop,setShowBackDrop] = useState(null);


     useEffect(() => {
        const storedUid = JSON.parse(localStorage.getItem('UID'));
        //Fetching the currency to maintain the consistency : 
        if (storedUid) {
            setUid(storedUid);
        }
        const storedCurrency = JSON.parse(localStorage.getItem("currencyType"));
        if(storedCurrency)
        setDisplayCurrency(storedCurrency.label)
    }, []);

    const [objWallet,setObjWallet] = useState({
        name : '',
        balance : '',
        uid : '',
        id : nanoid()
     })
     
     function DisplayCurrencyInfo(){
        setShowCurrencyInfo(true);
        setTimeout(()=>{
            setShowCurrencyInfo(false);    
        },7000)
     }

    function CloseCurrencyInfo(){
    setShowCurrencyInfo(false);
    }

    function AddWalletClose(){
        setShowAddWallet(false);
    }

    const DropDownVariants = {
        hidden:{
          opacity:0,
        },
        visible: {
          opacity: 1,
          transition: {
             duration: 0.3, 
             ease: 'easeInOut' 
          }
        },
        exit: {
          opacity: 0,
          transition: {
            duration: 0.3, 
            ease: 'easeInOut',
          }
        }
      }

      async function UpdateWalletDB(objWallet){
        try {
            setShowBackDrop(true);
            const updatedObjWallet = { ...objWallet, uid: uid };
            const newWalletRef = doc(collection(db, 'wallets'));
            await setDoc(newWalletRef, updatedObjWallet);
            setShowBackDrop(null);
        } catch (error) {
            console.log("Some Error occured : ",error);
            setShowBackDrop(null);
        }
      }

      function handleNameChange(e){
        const val = e.target.value.trim();
        if(val.length>0){
            setNameError(false);
            setObjWallet(prev=>({...prev,name:val}));
        }else{
            setNameError(true);
        }
      }

      function handleBalanceChange(e){
        const bal = e.target.value;
        if(bal.length>0){
            setBalanceError(false);
            setObjWallet(prev=>({...prev,balance:bal}))
        }else{
            setBalanceError(true);
        }
      }

       function AddWallet(){
        if(!objWallet.name && objWallet.name.length===0){
            setNameError(true);
            return;
        }
        if(!objWallet.balance){
            setBalanceError(true);
            return;
        }
         UpdateWalletDB(objWallet);
        setShowAddWallet(false);
      }

    return(

        <div className='limit--by--category--parent--div'>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={showBackDrop}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
                <motion.div 
                    variants={ModalVariant} 
                    initial='hidden' 
                    animate='visible' 
                    className='limit--by--category--child--div'
                >
                    <div className='limit--by--category--title--cross'>
                        <p className='limit--by--category--title'>Add Wallet</p>
                        <i 
                            class='bx bx-x' 
                            id="cross" 
                            onClick={()=>AddWalletClose()}
                        ></i>
                    </div>
                    <div className='underlined'>

                    </div>
                    <div className='wallet--name--input--div'>
                        <p className='wallet--name'>Name<span> *</span></p>
                        <input 
                            type='text' 
                            className='name--input--wallet' 
                            placeholder='eg.Bank of America' 
                            minLength={1} 
                            maxLength={25} 
                            onChange={handleNameChange}
                        ></input>
                        {nameError && <p className='warn'>Please specify a wallet name</p>}
                    </div>
                    <div className='currency--title--input--div'>
                        <div className='currency--info--icon--div'>
                            <p className='currency--title'>Currency</p>
                            <i 
                                onClick={()=>DisplayCurrencyInfo()} 
                                class='bx bx-info-circle' 
                                id='info--circle'
                            ></i>
                        </div>
                        <AnimatePresence>
                            {showCurrencyInfo && 
                                (<motion.div 
                                    variants={DropDownVariants} 
                                    initial='hidden' 
                                    animate='visible' 
                                    exit='exit' 
                                    className='simplicity--info--div'
                                >
                                    <div className='cross--div'>
                                        <i class='bx bx-x' id="cross" onClick={()=>CloseCurrencyInfo()} ></i>
                                    </div>
                                    <p className="simplicity--info">
                                        Track your expenses in a single currency for simplicity.
                                        The currency field is disabled to ensure consistency.
                                    </p>
                                </motion.div>)
                            }
                        </AnimatePresence>
                        <input type='text' className='currency--input' value={displayCurrency} disabled ></input>
                    </div>

                    <div className='amount--input--div'>
                        <p className='amount--title'>Balance<span> *</span></p>
                        <div className='amount--input--currency--type'>
                            <input 
                                style={{fontFamily:'Inter,san-serif'}}
                                type='number'
                                pattern="[0-9]*"
                                inputMode='numeric'
                                onChange={handleBalanceChange}
                                placeholder='0.00' 
                                className='amount--input' 
                                min="1"
                                max='1000000000'
                                maxLength='12'
                            ></input>
                            <p className='currency--type'>{displayCurrency}</p>
                        </div>
                        {balanceError && <p className='warn'>Ensure you have a sufficient balance in a Wallet</p>}
                    </div>
                    <button 
                        type='button' 
                        className='save--button' 
                        onClick={()=>AddWallet()}
                    >Add</button>
                </motion.div>
        </div>
    )
}
