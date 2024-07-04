import React, { useContext, useState,useEffect } from 'react'
import "../LimitByCategoryModal.css"
import { Box, TextField, MenuItem } from "@mui/material";
import '../ReportBug.css';
import { color, motion } from 'framer-motion';
import AppContext from '../context/AppContext';
import { db } from '../Firebase/firebase';
import { Autocomplete } from "@mui/material";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { collection , deleteDoc, getDocs, onSnapshot, orderBy, query, where,doc, updateDoc, addDoc} from 'firebase/firestore';
import { Snackbar, Alert,Slide } from '@mui/material';
import { styled } from '@mui/system';
import { colors } from './colors';
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

export default function LimitByCategoryModal() {

    const {showLimitsModal,setShowLimitsModal,uid,setUid} = useContext(AppContext);
    const [showBackDrop,setShowBackDrop] = useState(null);
    const [showNameErr,setShowNameErr] = useState(false);
    const [showLimitErr,setShowLimitErr] = useState(false);
    const [displayCurrency,setDisplayCurrency] = useState('');

    const [limitByCategoryObject,setLimitByCategoryObject] = useState({
        uid : null,
        limit : '',
        left : '',
        categoryNameChosen : '',
        suggestSpend : '',
        spent : 0,
        color : generateRandomColor(),
        percentage : '',
        id : nanoid(),
        // typeofTransaction : ''
    })

    const [currency,setCurrency] = useState('');
    const [defineCategoriesArray,setDefinedCategoriesArray] = useState([]);
    const [categoryChosen,setCategoryChosen] = useState('');

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    useEffect(()=>{
        const storedUid = JSON.parse(localStorage.getItem('UID'));
        if (storedUid) {
            setUid(storedUid);
        }

        const storedCurrency = JSON.parse(localStorage.getItem("currencyType"));
        if(storedCurrency){
            setDisplayCurrency(storedCurrency.label);
        }
    },[])

    useEffect(()=>{
        if(!uid) return;
        fetchCurrency(uid)
    },[uid]);

    useEffect(()=>{
        if (!uid) return;
        FetchCategories(uid)
    },[uid])


    async function AddLimitsByCategoryToDB(uid){
        try {
            const updatedLimitsByCategory = {...limitByCategoryObject,uid : uid}
            console.log(updatedLimitsByCategory);
            const limitsByCategoryRef = collection(db,'limitsByCategory');
            await addDoc(limitsByCategoryRef,updatedLimitsByCategory);
        } catch (error) {
            console.log("Some Error occured : ",error);
        }
    }

    async function fetchCurrency(uid){
        try {
            const q = query(collection(db,"users"),where('uid','==',uid));
            const unsubscribe = onSnapshot(q,(snapshot)=>{
                if(!snapshot.empty){
                    snapshot.docs.forEach((doc)=>{
                        const userData = doc.data();
                        setCurrency(userData.currency);
                    })
                }
            })

            return ()=>unsubscribe();
        } catch (error) {
            console.log("Error occured : ",error);
        }
    }

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
    

      

  function generateRandomColor(){
    const randomNumber = Math.floor(Math.random()*colors.length);
    const randomColor = colors[randomNumber];
    return randomColor;
  }

    async function FetchCategories(uid){
        try {
            const q = query(collection(db,'categories'),where('uid','==',uid),orderBy('categoryName'));
            const categoryDocumentArray = onSnapshot(q,(snapshot)=>{
                let labelCatgeoryArray = [];
                const categoryData = snapshot.docs.map((doc)=>{
                        const item = doc.data();
                        const categoryObject ={
                            label : `${item.categoryIcon} ${item.categoryName}`
                        }
                        labelCatgeoryArray.push(categoryObject);
                    })
                setDefinedCategoriesArray(labelCatgeoryArray);
                console.log(labelCatgeoryArray);
            })

            return ()=>categoryDocumentArray()
        } catch (error) {
            console.log("Some Error Occured : ",error);
        }
    }

    async function CheckIFLimitByCategoryExists(uid){
        try {
            const q = query(collection(db,'limitsByCategory'),where('uid','==',uid));
            const snapshot = await getDocs(q);
            let exists = false;
            snapshot.docs.forEach((doc)=>{
                const item = doc.data();
                if(item.categoryNameChosen.toLowerCase()===limitByCategoryObject.categoryNameChosen.toLowerCase()){
                    exists = true;
                }
            })
            return exists;
        } catch (error) {
            console.log("Some Error Occured : ",error);
        }
    }

    function handleChosenCategory(event,value){
        if(value && value.label){
            setLimitByCategoryObject(prev=>({...prev,categoryNameChosen : value.label}));
        }
    }

    function CloseLimitModal(){
        setShowLimitsModal(false);
    }    

    function handleAmountLimitChange(event){
        const val = event.target.value;
        setLimitByCategoryObject(prev=>({...prev,limit : val}));
    }

    async function submitToDB(){
        if(!limitByCategoryObject.limit){
            setShowLimitErr(true);
            return;
        }
        if(!limitByCategoryObject.categoryNameChosen){
            setShowNameErr(true);
            return;
        }
        setShowBackDrop(true);
        const exist = await CheckIFLimitByCategoryExists(uid);
        if(exist){
            showSnackbar('Category Already Exists', 'error');
            setShowBackDrop(false);
            return;
        }
        await AddLimitsByCategoryToDB(uid);
        setShowLimitErr(false);
        setShowNameErr(false);
        setShowLimitsModal(false);
        setShowBackDrop(false);
    }

    return(

        <div className='limit--by--category--parent--div'>
                <Backdrop
                        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                        open={showBackDrop}
                    >
                        <CircularProgress color="inherit" />
                    </Backdrop>
                <motion.div variants={ModalVariant} initial='hidden' animate='visible' className='limit--by--category--child--div'>
                    <div className='limit--by--category--title--cross'>
                        <p className='limit--by--category--title'>Add Limits by Category</p>
                        <i class='bx bx-x' id="cross1" onClick={()=>CloseLimitModal()}></i>
                    </div>
                    <div className='underlined'>

                    </div>
                    <div className='category--textFieldInput--div'>
                        <p className='categ--title--limits'>Category</p>
                        <Autocomplete
                        disablePortal
                        value={limitByCategoryObject.categoryNameChosen}
                        id="combo-box-demo"
                        options={defineCategoriesArray}
                        onChange={handleChosenCategory}
                        clearIcon={null}
                        fullWidth
                        renderInput={(params) => <TextField  placeholder="Select Category" {...params}
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
                            color: 'rgb(220, 220, 220)',
                            padding: '5px !important',
                            fontSize: '0.9rem',
                        },
                        '& .MuiAutocomplete-icon': {
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
                    />}
                    />
                    {showNameErr && <p className='warn'>Please specify the category</p>}
                    </div>
                    
                    <div className='amount--input--div'>
                        <p className='amount--title'>Amount</p>
                        <div className='amount--input--currency--type'>
                            <input type='number' placeholder='0.00' onChange={handleAmountLimitChange} value={limitByCategoryObject.limit} className='amount--input' min="1"></input>
                            <p className='currency--type'>{displayCurrency}</p>
                        </div>
                        {showLimitErr && <p className='warn'>Kindly specify the limit.</p>}
                    </div>
                    <button type='button' className='save--button' onClick={()=>submitToDB()}>Save</button>
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
