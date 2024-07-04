import React, { useContext, useEffect, useState } from 'react'
import "../LimitByCategoryModal.css"
import "../AddSubscriptionModal.css"
import '../ReportBug.css';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { motion } from 'framer-motion';
import { ModalVariant } from './LimitByCategoryModal';
import AppContext from '../context/AppContext';
import { collection,addDoc,serverTimestamp,doc, query,where, getDocs } from 'firebase/firestore';
import { db } from '../Firebase/firebase';
import { nanoid } from 'nanoid';
import { Snackbar, Alert,Slide } from '@mui/material';
import { styled } from '@mui/system';
import Autocomplete from "@mui/material/Autocomplete";
import { Box, TextField, MenuItem } from "@mui/material";


export default function AddSubscriptionModal() {

    const {showSubscriptionModal,setShowSubscriptionModal,uid,setUid} = useContext(AppContext);
    const [open,setOpen] = useState(false);
    const [emojiMessage,setEmojiMessage] = useState(false);
    const [displayCurrency,setDisplayCurrency] = useState('');
    const [descripAmt,setDescripAmt] = useState({
        uid : '',
        description : '',
        amount : '',
        status : "pending",
        createdAt : serverTimestamp(),
        subscriptionCompletedOn : '',
        id:nanoid(),
        imageURL : '',
        duration : '',
        renewalDate : ''
    })
    const [duration,setDuration] = useState('')
    const [infoMessage,setInfoMessage] = useState(false);
    const [showAmountWarn,setShowAmountWarn] = useState(false);
    const [showDurationWarn,setShowDurationWarn] = useState(false);
    const [nameOfBrand,setNameOfBrand] = useState('')
    useEffect(()=>{
        const storedUid = JSON.parse(localStorage.getItem('UID'));
        if (storedUid) {
            setUid(storedUid);
        }
        const storedCurrency = JSON.parse(localStorage.getItem("currencyType"));
        setDisplayCurrency(storedCurrency.label);
    },[])

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    async function fetchBrandLogo(brandDomain) {
        const BRANDFETCH_API_KEY = 'lrU0bHVxH9+3RjjrMBN1JcwVeuy4qDZOEV+tkQItqqo='; // Replace with your actual API key
        const url = `https://api.brandfetch.io/v2/brands/${brandDomain}`;
    
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${BRANDFETCH_API_KEY}`
            }
          });
    
          const brand = await response.json();
          console.log(brand);
    
          // Extract the best logo based on the provided logic
          const maybeIcon = brand.logos.find(logo => logo.type === 'icon');
          // const maybeSymbolDark = brand.logos.find(logo => logo.type === 'symbol' && logo.theme === 'dark');
          // const maybeSymbolLight = brand.logos.find(logo => logo.type === 'symbol' && logo.theme === 'light');
          const maybeLogomarkDark = brand.logos.find(logo => logo.type === 'logo' && logo.theme === 'dark');
          const maybeLogomarkLight = brand.logos.find(logo => logo.type === 'logo' && logo.theme === 'light');
    
          const bestLogo = maybeIcon ??  maybeLogomarkDark ?? maybeLogomarkLight;
    
          if (bestLogo) {
            const logoImage = bestLogo.formats.find(format => format.format === 'svg') ?? bestLogo.formats[0];
            const url = logoImage.src;
            return url;
          }else {
            return null;
        }
    
        } catch (error) {
          console.error('Error fetching brand logo:', error);
        }
      }

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

    function CloseSubscriptionModal(){
        setShowSubscriptionModal(false);
    }    

    
    function handleDescriptionChange(event){
        const val = event.target.value;
        if(!val){
            setInfoMessage(true);
        }else{
            setInfoMessage(null);
        }
        setDescripAmt(prev=>({...prev,description : val}));
        setNameOfBrand(val);
    }


    function handleAmountChange(event){
        const val = event.target.value.trim();
        if(!val){
            setShowAmountWarn(true);
        }else{
            setShowAmountWarn(null);
        }
        setDescripAmt(prev=>({...prev,amount : val}));;
    }

    async function AddSubscriptionCategory(uid){
        if(!descripAmt.description){
            setInfoMessage(true);
            // return;  
        } 
        if(!descripAmt.amount){
            setShowAmountWarn(true);
            // return;
        }
        if(!descripAmt.duration){
            setShowDurationWarn(true);
            return;
        }
        try {
            setOpen(true);
            const name = descripAmt.description
            const exist = await CheckIfSubscriptionAlreadyexists(uid,name);
            if(exist){
                showSnackbar('Subscription with same description exists', 'error');
                setOpen(false);
                return;
            }
            const lowercaseName = nameOfBrand.toLowerCase();
            const logoURL = await fetchBrandLogo(`${lowercaseName}.com`);
            const updatedSubscription = {...descripAmt,duration : duration,uid : uid,imageURL: logoURL !== undefined ? logoURL : null}
            const subscriptionRef = collection(db,'subscriptions');
            await addDoc(subscriptionRef,updatedSubscription);
            setShowSubscriptionModal(false);
            setOpen(null)
        } catch (error) {
            console.log("Error occured : ",error);
            setOpen(null)
        }
    }

    async function CheckIfSubscriptionAlreadyexists(uid, name){
    try {
        const q = query(collection(db,'subscriptions'), where('uid', '==', uid));
        let exists = false;
        const docSnapshot = await getDocs(q);
        if (docSnapshot.docs.length > 0) {
            const document = docSnapshot.docs[0];
            const item = document.data();
            if (item.description.toLowerCase() === name.toLowerCase()) {
                exists = true;
            }
        }
        return exists
    } catch (error) {
        console.log("Error occurred ", error);
        }
    }

    const data = [
        { label: 'Monthly', value: '1' },
        { label: '3-Monthly', value: '3' },
        { label: '6-Monthly', value: '6' },
        { label: 'Yearly', value: '12' },
    ]

    function handleDurationChange(event,value){
        if(value && value.label){
            setDescripAmt(prev=>({...prev,duration : value.label}))
            setDuration(value.value);
            setShowDurationWarn(null);
        }else{
            setShowDurationWarn(true);
            setDescripAmt(prev=>({...prev,duration : null}))
        }
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
                        <p className='limit--by--category--title'>Add Subscription</p>
                        <i class='bx bx-x' id="cross1" onClick={()=>CloseSubscriptionModal()}></i>
                    </div>
                    <div className='underlined'>

                    </div>
                    <div className='description--div'>
                        <p className='description--title'>Description</p>
                        <div className='description--input--div'>
                            <input value={descripAmt.description} onChange={handleDescriptionChange} type='text' placeholder='eg.Netflix' maxLength={30} className='description--input'></input>
                        </div>
                        {infoMessage && <p className='warn'>Please specify the description</p>}
                    </div>                

                    <div className='duration--div'>
                        <p className='description--title'>Duration</p>
                    <Box width="100%" height="2%" className="textField--category--icon--container" >
                <Autocomplete
                        disablePortal
                        id="combo-box-demo"
                        options={data}
                        value={descripAmt.duration}
                        onChange={handleDurationChange}
                        clearIcon={null}
                        fullWidth
                        renderInput={(params) => <TextField {...params} placeholder="Select Duration"
                            sx={{
                                ...params.InputProps.sx,
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: 'none',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'none',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'transparent',
                                    },
                                    '& .Mui-disabled':{
                                        color:'white' // Change disabled text color to white
                                    },
                                },
                                '& .MuiOutlinedInput-input': {
                                    color: 'rgb(220, 220, 220)',
                                    padding: '5px !important',
                                    fontSize: '0.8rem',
                                },
                                '& .MuiAutocomplete-icon': {
                                    color: 'white',
                                },
                                '& .Mui-focused': {
                                    outline: 'none',
                                },
                                '& .Mui-disabled': {
                                    color: 'white !important', // Ensure the text color is correct
                                    WebkitTextFillColor: 'white !important', // Ensure the text color is correct for Webkit browsers
                                },
                                '& .MuiInputBase-input.Mui-disabled': {
                                    WebkitTextFillColor: 'white !important',
                                    color: 'white !important',
                                },
                                '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(71, 71, 71, 0.443) !important', // Adjust border color if needed
                                    // backgroundColor: backgroundStyles.backgroundColor,
                                },
                            }}
                            SelectProps={{
                                MenuProps: {
                                    sx: {
                                        '& .MuiPaper-root': {
                                            backgroundColor: 'rgba(10, 9, 9, 0.955)',
                                            color: 'whitesmoke',
                                        },
                                        '& .MuiMenuItem-root': {
                                            fontSize: '0.7rem',
                                        },
                                        '& .Mui-selected': {
                                            backgroundColor: '#242424 !important',
                                        },
                                    },
                                },
                            }}
                        />}
                    />
                </Box>
                {showDurationWarn && <p className='warn'>Kindly specify the duration of your subscription</p>}
                    </div>

                    <div className='amount--input--div'>
                        <p className='amount--title'>Amount</p>
                        <div className='amount--input--currency--type'>
                            <input value={descripAmt.amount} onChange={handleAmountChange} type='number' placeholder='0.00' className='amount--input' min="1"></input>
                            <p className='currency--type'>{displayCurrency}</p>
                        </div>
                        {showAmountWarn && <p className='warn'>Kindly specify the amount</p>}
                    </div>
                    <button type='button' className='save--button' onClick={()=>AddSubscriptionCategory(uid)}>Save</button>
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


 {/* <div className='category--textFieldInput--div'>
                        <p className='categ--title'>Category<span> *</span></p>
                        <Box width="100%" height="2%" className="textField--category--icon--container" >
                            <TextField 
                                className='textField'
                                select 
                                value="performance"
                                placeholder='hello' 
                                onChange="" 
                                fullWidth
                                InputProps={{
                                    style: {
                                        color: 'white',
                                        fill:'white',
                                        border: '1px solid grey',
                                        textIndent:'5px',
                                        outline: 'none', // Remove default outline
                                    },
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: 'none',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'none',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'transparent',
                                        },
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: 'white',
                                        padding: '15px !important',
                                        fontSize:'0.85rem',
                                    },
                                    '& .MuiSelect-icon': {
                                        color: 'white',
                                    },
                                    '& .Mui-focused': {
                                        outline: 'none',
                                    }
                                }}
                                SelectProps={{
                                    MenuProps: {
                                        sx: {
                                            '& .MuiPaper-root': {
                                                backgroundColor: 'rgba(10, 9, 9, 0.955)',
                                                color: 'whitesmoke',
                                            },
                                            '& .MuiMenuItem-root': {
                                                fontSize: '0.7rem',
                                            },
                                            '& .Mui-selected': {
                                                backgroundColor: '#242424 !important',
                                            },
                                        },
                                    },
                                }}
                            >
                                <MenuItem value='performance'>Performance Bugs</MenuItem>
                                <MenuItem value='security'>Security Bugs</MenuItem>
                        </TextField>
                        </Box>
                    </div> */}