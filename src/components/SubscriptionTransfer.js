import React, { useContext, useState,useEffect } from 'react'
import "../LimitByCategoryModal.css"
import { Box, TextField, MenuItem } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import '../ReportBug.css';
import "../SubscriptionTransfer.css"
import { motion } from 'framer-motion';
import pizza from "../pizza.png"
import AppContext from '../context/AppContext';
import { getDocs, query,where,doc,collection,updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../Firebase/firebase';
import { Snackbar, Alert,Slide } from '@mui/material';
import { styled } from '@mui/system';
import defaultImage from "../other.png"
import { nanoid } from 'nanoid';

export const ModalVariant = {
        hidden:{
            y:'-250px',
            opacity:0
        },
        visible:{
            y:0,
            opacity:1,
            transition:{
                type:'spring',
                stiffness:'100'
            }
        },
        exit:{
            y:'-250px',
            transition:{
                type:'spring',
                stiffness:'100'
            }
        }
}

export default function SubscriptionTransfer(props) {

    const {showLimitsModal,
            setShowLimitsModal,
            setShowConfirmSubscriptionTransfer,
            uid,
            setUid
        } = useContext(AppContext);


        const [currentWalletID, setCurrentWalletID] = useState('');

    const [transactionObject,setTransactionObject] = useState({
        date : null,
        imageURL : '',
        amount : '',
        id : nanoid(),
        typeOfTransaction : 'subscription',
        uid : '',
        walletName : '',
        wallet_id : '',
        description : '',
        createdDate : Timestamp.now(),
        dateOfTransaction : null
    })

    useEffect(()=>{
        const storedUid = JSON.parse(localStorage.getItem('UID'));
        if (storedUid) {
            setUid(storedUid);
        }

        const storedWalletId  = JSON.parse(localStorage.getItem("wallet_id"))
        if(storedWalletId){
            setTransactionObject(prev=>({...prev,wallet_id : storedWalletId}));
            setCurrentWalletID(storedWalletId);
        }


        const storedWallet = JSON.parse(localStorage.getItem('currentWallet'));
        if(storedWallet){
            setTransactionObject(prev=>({...prev,walletName : storedWallet}));
            // console.log(storedWallet);
        }


    },[])

    const [date,setDate] = useState(null);
    const [subscriptionObject,setSubscriptionObject] = useState({
        date : null,
        status : 'completed',
        renewalDate : ''
    })
    
    const [open,setOpen] = useState(null);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
      //Snackbar : 

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
        return;
    }
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity = 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };



  const StyledSnackbar = styled(Snackbar)(({ theme }) => ({
      '& .MuiSnackbarContent-root': {
          backgroundColor: '#333',
          color: '#fff',
      }
  }));

  const StyledAlert = styled(Alert)(({ theme }) => ({
      width: '100%',
      backgroundColor: '#8c0e0e',
      color: 'whitesmoke',
  }));

  const SlideTransition = (props) => {
      return <Slide {...props} direction="left" />;
  };


    function CloseConfirmSubscriptionModal(){
        setShowConfirmSubscriptionTransfer(false);
    }    

    async function AssignTheDataAndAddTransaction(item){
        try {
            const updatedObject = {
                ...transactionObject,
                imageURL : item.imageURL,
                amount : item.amount,
                description : item.description,
                uid : uid
            }
            const transactionRef = collection(db,'transactions');
            await addDoc(transactionRef,updatedObject);
        } catch (error) {
            console.log("Error occured : ",error);
        }
    }

    async function CheckIfSufficientBalance(uid) {
        try {
            const q = query(collection(db, 'wallets'), where('uid', '==', uid), where('id', '==', currentWalletID));
            const snapshots = await getDocs(q);
            let isLess = false;
    
            if (!snapshots.empty) {
                for (const walletDoc of snapshots.docs) {
                    const walletItem = walletDoc.data();
                    const amountInWallet = parseFloat(walletItem.balance);
    
                    if (isNaN(amountInWallet)) {
                        console.error('Invalid wallet balance:', amountInWallet);
                        return true;  // Handle invalid wallet balance appropriately
                    }
    
                    const w = query(collection(db, 'subscriptions'), where('uid', '==', uid), where('id', '==', props.id));
                    const subscriptionSnapshots = await getDocs(w);
                    let subscriptionAmount;
    
                    if (!subscriptionSnapshots.empty) {
                        for (const subscriptionDoc of subscriptionSnapshots.docs) {
                            const subscriptionItem = subscriptionDoc.data();
                            subscriptionAmount = parseFloat(subscriptionItem.amount);
    
                            if (isNaN(subscriptionAmount)) {
                                console.error('Invalid subscription amount:', subscriptionAmount);
                                return true;  // Handle invalid subscription amount appropriately
                            }
                        }
                    }
    
                    const newBalance = amountInWallet - subscriptionAmount;
                    // console.log('New Balance:', newBalance);
                    // console.log('Amount in Wallet:', amountInWallet);
                    // console.log('Subscription Amount:', subscriptionAmount);
    
                    if (newBalance < 0) {
                        isLess = true;
                    }
    
                    if (!isLess) {
                        const walletDocRef = walletDoc.ref;
                        await updateDoc(walletDocRef, { balance: newBalance });
                    }
                }
            }
    
            return isLess;
        } catch (error) {
            console.log("Error occurred:", error);
            return true;  // Handle the error appropriately
        }
    }

    async function SaveTheTransaction() {
        try {
            const subscriptionDate = dayjs(subscriptionObject.date);
            if (!subscriptionObject.date) {
                showSnackbar('Please mention the date ', 'error');
                return;
            }
    
            const isLess = await CheckIfSufficientBalance(uid);  // Add 'await' here
    
            if (!isLess) {
                setOpen(true);
                const q = query(collection(db, "subscriptions"), where('uid', '==', uid));
                const docSnapshot = await getDocs(q);
    
                for (const doc of docSnapshot.docs) {
                    const item = doc.data();
                    const renewalDay = subscriptionDate.add(item.duration, 'month').format('MMMM DD, YYYY');
                    const updatedObject = { ...subscriptionObject, renewalDate: renewalDay };
    
                    if (item.id === props.id) {
                        const docRef = doc.ref;
                        console.log(item);
                        await AssignTheDataAndAddTransaction(item);
                        await updateDoc(docRef, updatedObject);
                        setShowConfirmSubscriptionTransfer(false);
                    }
                }
                setOpen(null);
            } else {
                showSnackbar('Insufficient Balance', 'error');
                console.log("Shit balance nai hai");
            }
        } catch (error) {
            console.log("Error occurred:", error);
            setOpen(null);
        }
    }

    function formatDate(date) {
        return dayjs(date).format('MMMM DD, YYYY');
    }

    function handleDateChange(newDate) {
        // setDate(newDate);
        const formattedDate = formatDate(newDate)
        setDate(newDate);
        console.log(formatDate(newDate)) //Month DD, YYYY.....format
        setSubscriptionObject(prev=>({...prev,date : formattedDate}));
        setTransactionObject(prev=>({...prev,date : formattedDate}));
        setTransactionObject(prev=>({...prev,dateOfTransaction : dayjs(newDate).toDate()}));
        
    }

    return(

        <div className='limit--by--category--parent--div'>
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={open}
                >
                    <CircularProgress color="inherit" />
                </Backdrop>
                <motion.div variants={ModalVariant} initial='hidden' animate='visible' className='limit--by--category--child--div'>
                    <div className='limit--by--category--title--cross'>
                        <p className='limit--by--category--title'>Mark Subscription as Complete</p>
                        <i class='bx bx-x' id="cross1" onClick={()=>CloseConfirmSubscriptionModal()}></i>
                    </div>
                    <div className='underlined'>

                    </div>
                    <div className='confirmation--div'>
                        <div className='confirmation--info'>
                            This will add a transaction and complete the subscription for :   
                        </div>
                        <div className='brand--name--logo--div'>
                            <img src={props.imageURL? props.imageURL : defaultImage} className='image--logo'></img> 
                            <p className='description--subs'>
                                {props.description}
                            </p>
                        </div>
                    </div>
                    <p className='event--date--head'>Event Date<span> *</span></p>
                    <div className="date--picker--div1">
                        <Box style={{width:'100% !important'}}>
                            <LocalizationProvider dateAdapter={AdapterDayjs} >
                                <DatePicker
                                    width='100%'
                                    value={date}
                                    onChange={handleDateChange}
                                    className="date--picker"
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            color: 'white',
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'grey',
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'transparent',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'transparent',
                                            },
                                        },
                                        '& .MuiSvgIcon-root': {
                                            color: 'white',
                                        },
                                        '& .MuiButtonBase-root': {
                                            color: 'white',
                                        },
                                        '& .MuiInputAdornment-root': {
                                            color: 'white',
                                        },
                                        '& .MuiFormLabel-root': {
                                            color: 'white',
                                        },
                                        '& .MuiInputBase-input': {
                                            color: 'white',
                                        },
                                        '& .MuiPickersDay-dayWithMargin': {
                                            color: 'white',
                                        },
                                        '& .MuiIconButton-root': {
                                            color: 'white',
                                        },
                                        '& .MuiPickersCalendarHeader-label': {
                                            color: 'white',
                                        },
                                        '& .MuiPickersCalendarHeader-iconButton': {
                                            color: 'white',
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Box>
                        <button type='button' className='save' onClick={()=>SaveTheTransaction()}>Save</button>
                    </div>
                </motion.div>
                <StyledSnackbar 
                    open={snackbarOpen} 
                    autoHideDuration={4000} 
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    TransitionComponent={SlideTransition}
                    onBlur={() => showSnackbar('Salary updated', 'info')}
                >
                    <StyledAlert onClose={handleSnackbarClose} severity={snackbarSeverity}>
                        {snackbarMessage}
                    </StyledAlert>
                </StyledSnackbar>
        </div>
    )
}
