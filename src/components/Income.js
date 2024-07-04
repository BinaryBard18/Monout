import React,{useContext,useEffect,useState} from "react";
import AppContext from '../context/AppContext';
import { Box, TextField, MenuItem } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import { Snackbar, Alert,Slide } from '@mui/material';
import { styled } from '@mui/system';
import "../LimitByCategoryModal.css"
import "../AddSubscriptionModal.css"
import "../AddTransaction.css"
import '../ReportBug.css';
import "../Expense.css";
import { collection,where,getDocs, onSnapshot,orderBy, addDoc,updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { useParams } from "react-router-dom";
import { nanoid } from "nanoid";
import { query } from "firebase/firestore";
import Autocomplete from "@mui/material/Autocomplete";

export default function Expense(){

    const {showAddTransactionModal,
        setShowAddTransactionModal,
        setShowExpense,
        setShowLimitsModal,
        setShowIncome,
        setShowTransfer,
        uid,
        setUid
        } = useContext(AppContext);

    const {id} = useParams();
    
    const [displayCurrency,setDisplayCurrency] = useState('');
    const [showAmountWarn,setShowAmountWarn] = useState(false);
    const [showDescriptionWarn,setShowDescriptionWarn] = useState(false);
    const [showCategoryWarn,setShowCategoryWarn] = useState(false);
    const [showDateWarn,setShowDateWarn] = useState(false);
    const [limitsByCategoryArray,setLimitsByCategoryArray] = useState([]);
    const [walletName,setWalletName] = useState('');

    const [showLoader,setShowLoader] = useState(false);
    const [wallet_Id,setWallet_Id] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');



    const [expense,setExpense] = useState({
        uid : '',
        id : nanoid(),
        walletName : '',
        amount : '',
        typeOfTransaction : 'income',
        description : '',
        category : '',
        date : '',
        wallet_id : '',
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
            setWallet_Id(storedWalletId);
            console.log(storedWalletId)
        }

        const storedWallet = JSON.parse(localStorage.getItem('currentWallet'));
        if(storedWallet){
            setWalletName(storedWallet);
            console.log(storedWallet);
        }

        const storedCurrency = JSON.parse(localStorage.getItem("currencyType"));
        if(storedCurrency){
            setDisplayCurrency(storedCurrency.label);
        }
    },[])

    useEffect(()=>{
        if(!uid) return;
        fetchLimitsByCategory(uid)
    },[uid])

    function handleExpenseAmountChange(event){
        const val = event.target.value;
        if(!val){
            setShowAmountWarn(true);
        }else{
            setShowAmountWarn(false);
        }
        setExpense(prev=>({...prev,amount : val}));
    }

    function handleDescriptionChange(event){
        const val = event.target.value;
        if(!val){
            setShowDescriptionWarn(true);
        }else{
            setShowDescriptionWarn(false);
        }
        setExpense(prev=>({...prev,description : val}))
    }

    function CloseExpenseTransactionModal(){
        setShowAddTransactionModal(false);
        setShowIncome(false)
        setShowTransfer(false);
    }   

    function OpenLimitsModal(){
        setShowIncome(false)
        setShowTransfer(false);
        setShowLimitsModal(true);
        setShowAddTransactionModal(false);
    }

    async function SubtractFromTheWallet(uid, expense) {
        try {
            const q = query(collection(db, 'wallets'), where('uid', '==', uid), where('id', '==', wallet_Id));
            const querySnapshot = await getDocs(q); // Use getDocs to fetch the documents once
            querySnapshot.forEach(async (doc) => {
                const item = doc.data();
                const amountInWallet = parseFloat(item.balance);
                const incomeAmount = parseFloat(expense.amount);
                const newAmount = amountInWallet + incomeAmount;
    
                const documentRef = doc.ref;
                await updateDoc(documentRef, { balance: newAmount });
            });

        } catch (error) {
            console.log("Error occurred: ", error);
            return true; // Handle error by returning true to indicate subtraction failed
        }
    }

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const showSnackbar = (message, severity = 'success') => {
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
        backgroundColor: 'darkred',
        color: 'whitesmoke',
    }));

    const SlideTransition = (props) => {
        return <Slide {...props} direction="bottom" />;
    };

    async function AddExpenditure(uid,walletName){
        try {
            if(!expense.amount){
                showSnackbar('Please fill the details', 'error');
                return;
            }
            if(!expense.description){
                showSnackbar('Please fill the details', 'error');
                return;
            }
            if(!expense.date){
                showSnackbar('Please fill the details', 'error');
                return;
            }
            setShowLoader(true);
            const updatedObject = {...expense,uid : uid,walletName : walletName,wallet_id : wallet_Id};
            const docRef = collection(db,'transactions');
            await addDoc(docRef,updatedObject);
            await SubtractFromTheWallet(uid, expense)
            setShowLoader(null)
            CloseExpenseTransactionModal();
        } catch (error) {
            console.log("Error occured : ",error);
            setShowLoader(null);
        }
    }

    async function fetchLimitsByCategory(uid){
        try {
            const q = query(collection(db,'categories'),where('uid','==',uid));
            onSnapshot(q,(snapshot)=>{
                if(!snapshot.empty){
                    let array = []
                    snapshot.docs.map((doc)=>{
                    const item = doc.data();
                    const arrayObjects = {
                        label : `${item.categoryIcon} ${item.categoryName}`
                    }
                    array.push(arrayObjects);
                    })
                    console.log(array)
                    setLimitsByCategoryArray(array);
                }
            })

        } catch (error) {
            console.log("Error occured : ",error);
        }
    }

    function formatDate(date) {
        return dayjs(date).format('MMMM DD, YYYY');
    }

    function handleDateChange(newDate) {
        if(!newDate){
            setShowDateWarn(true);
            return
        }else{
            const formattedDate = formatDate(newDate);
            console.log(formattedDate)
            setExpense(prev=>({...prev,date : formattedDate}));
            setExpense(prev=>({...prev,dateOfTransaction : dayjs(newDate).toDate()}));
        }
    }

    function handleCategoryChange(event,value){
        if(value&&value.label){
            setExpense(prev=>({...prev,category:value.label}));
            console.log(value.label);
            setShowCategoryWarn(false);
        }else{
            setShowCategoryWarn(true);
            setExpense(prev=>({...prev,category : ''}))
        }
    }

    return(
        <div>
            <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={showLoader}
                >
                    <CircularProgress color="inherit" />
            </Backdrop>
            <div className='description--div'>
                <div className="amount--description--div">
                    <div className="amount--div">
                        <p className="title--amount">Amount</p>
                        <div className="amt--input--currency--type" >
                            <input style={{borderColor : showAmountWarn ? "#b01018" : 'grey',fontFamily:'Inter,san-serif'}} type='number' value={expense.amount} placeholder='0.00' className='amt--input--number' min="1" onChange={handleExpenseAmountChange}></input>
                            <p className='typeOfCurrency'>{displayCurrency}</p>
                        </div>
                    </div>
                    <div className="descrip--div">
                        <p className="title--description">Description</p>
                        <input style={{borderColor : showDescriptionWarn ? "#b01018" : 'grey'}} type='text' value={expense.description} placeholder='Freelance' className='amt--input' minLength="1" maxLength={50} onChange={handleDescriptionChange}></input>
                    </div>
                    
                </div>
            </div>
            <div className='category--textFieldInput--div'>
                <p className='categ--title'>Category</p>
                <Box width="100%" height="2%" className="textField--category--icon--container" >
                <Autocomplete
                        disablePortal
                        id="combo-box-demo"
                        options={limitsByCategoryArray}
                        value={expense.category}
                        onChange={handleCategoryChange}
                        clearIcon={null}
                        fullWidth
                        renderInput={(params) => <TextField {...params} placeholder="Choose Category"
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
                                    padding: '9px !important',
                                    fontSize: '1rem',
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
                {showCategoryWarn && <div>
                    <p className="warn">Kindly mention the category</p>
                </div>}
            </div>
            <p className="addCategory--link">Don't see a category you need? <span onClick={()=>OpenLimitsModal()}><u>+Add Category</u></span></p>
            <p className="event--date">Event Date</p>
            <div className="date--picker--div">
            <Box style={{width:'100% !important'}}>
                    <LocalizationProvider dateAdapter={AdapterDayjs} >
                        <DatePicker
                            onChange={handleDateChange}
                            width='100%'
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
                <button type='button' className='save' onClick={()=>AddExpenditure(uid,walletName)}>Save</button>
            </div>
            {showDateWarn && <div>
                <p className="warn">Please select a date</p>
            </div>}
            <StyledSnackbar 
                open={snackbarOpen} 
                autoHideDuration={4000} 
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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