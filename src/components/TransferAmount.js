import React,{useContext,useEffect,useState} from "react";
import AppContext from '../context/AppContext';
import { Box, TextField } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import transfer from "../transfer.png"
import { DatePicker } from "@mui/x-date-pickers";
import Backdrop from '@mui/material/Backdrop';
import { Snackbar, Alert,Slide } from '@mui/material';
import { styled } from '@mui/system';
import CircularProgress from '@mui/material/CircularProgress';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import "../TransferAmount.css"
import "../LimitByCategoryModal.css"
import "../AddSubscriptionModal.css"
import "../AddTransaction.css"
import '../ReportBug.css';
import "../Expense.css";
import { useParams } from "react-router-dom";
import Autocomplete from "@mui/material/Autocomplete";
import { collection, onSnapshot, query,where,addDoc, getDocs, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import { nanoid } from "nanoid";


export default function TransferAmount(){

    const {showAddTransactionModal,
        setShowAddTransactionModal,
        setShowExpense,
        setShowLimitsModal,
        setShowTransfer,
        setShowIncome,
        uid,
        setUid
    } = useContext(AppContext);

    const {id} = useParams();

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const [displayCurrency,setDisplayCurrency] = useState('');
    const [walletArray,setWalletArray] = useState([]);
    const [selectedWalletTo,setSelectedWalletTo] = useState(null);

    const [walletName,setWalletName] = useState('')
    const [showToWarn,setShowToWarn] = useState(null);
    const [showAmountWarn,setShowAmountWarn] = useState(false);
    const [showDescriptionWarn,setShowDescriptionWarn] = useState(false);
    const [showDateWarn,setShowDateWarn] = useState(false);
    const [wallet_Id,setWallet_Id] = useState('');
    const [showBackDrop,setShowBackDrop] = useState(null)
    

    const backgroundStyles = {
        backgroundColor:'rgba(71, 71, 71, 0.443)',
        color:'rgba(195, 195, 195, 0.956)'
    }

    const [transferObject,setTransferObject] = useState({
        uid : '',
        id : nanoid(),
        imageURL : transfer,
        wallet_id_to : '',
        date : '',
        wallet : '',
        amount : '',
        description : '',
        typeOfTransaction : 'transfer',
        wallet_id_from : '',
        createdDate : Timestamp.now(),
        dateOfTransaction : null
    })


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



    useEffect(()=>{
        const storedWallet = JSON.parse(localStorage.getItem('currentWallet'));
        if(storedWallet){
            setWalletName(storedWallet);
        }

        const storedWalletId  = JSON.parse(localStorage.getItem("wallet_id"))
        if(storedWalletId){
            setWallet_Id(storedWalletId);
        }

    },[])

    useEffect(()=>{
        const storedUid = JSON.parse(localStorage.getItem("UID"));
        if(storedUid){
            setUid(storedUid)
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
    },[]);

    useEffect(()=>{
        if(!uid) return;
        // console.log(uid)
        fetchWalletDetails(uid)
    },[uid]);

    function CloseExpenseTransactionModal(){
        setShowAddTransactionModal(false);
        setShowIncome(false);
        setShowTransfer(false);
    }   

    function handleToChange(event,newValue){
        if(!newValue){
            setShowToWarn(true);
            setSelectedWalletTo(null);
        }else{
            setSelectedWalletTo(newValue);
            console.log(newValue.name)
            setShowToWarn(false);
        }
    }

    async function fetchWalletDetails(uid){
        try {
            const q = query(collection(db, 'wallets'), where('uid', '==', uid));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                let array = [];
                if (!snapshot.empty) {
                    snapshot.docs.map((doc) => {
                        const item = doc.data();
                        const walletObject = {
                            name: item.name,
                            id: item.id,
                        };
                        array.push(walletObject);
                    });
                    setWalletArray(array);
                } else {
                    setWalletArray([]);
                }
            });
            return () => unsubscribe();
        } catch (error) {
            console.log("Error occured : ",error);
        }
    }

    function handleDescriptionChange(event){
        const val = event.target.value;
        if(!val){
            setShowDescriptionWarn(true);
            setTransferObject(prev=>({...prev,description : null}))
        }else{
            setShowDescriptionWarn(false);
            setTransferObject(prev=>({...prev,description : val}))
        }
    }

    function handleAmountChange(event){
        const val = event.target.value;
        if(!val){
            setShowAmountWarn(true);
            setTransferObject(prev=>({...prev,amount : null}))
        }else{
            setShowAmountWarn(false);
            setTransferObject(prev=>({...prev,amount : val}))
        }
    }

    function formatDate(date) {
        return dayjs(date).format('MMMM DD, YYYY');
    }

    function handleDateChange(newDate){
        if(!newDate){
            setShowDateWarn(true);
            return;
        }else{
            const formattedDate = formatDate(newDate);
            setTransferObject(prev=>({...prev,date : formattedDate}));
            setTransferObject(prev=>({...prev,dateOfTransaction : dayjs(newDate).toDate()}));
        }
    }

    // const availableWalletsTo = walletArray.filter(wallet => wallet.name !== selectedWalletFrom?.name);
    const availableWallets = walletArray.filter(wallet=>wallet.name!=walletName);

    async function ManageBalanceOnAddingTransactionInFromWallet(uid) {
        try {
            const q = query(collection(db, 'wallets'), where('uid', '==', uid), where("id", '==', wallet_Id));
            const allDocs = await getDocs(q);
            if (!allDocs.empty) {
                let isLess = false;
                for (const doc of allDocs.docs) {
                    const item = doc.data();
                    const amount = parseFloat(item.balance);
                    const transferAmount = parseFloat(transferObject.amount);
                    const newAmountInFrom = amount - transferAmount;
                    if (newAmountInFrom < 0) { // should be < 0 instead of <= 0 to prevent zero balance
                        isLess = true;
                        showSnackbar('Insufficient balance', 'error');
                    }
                    if (!isLess) {
                        const documentRef = doc.ref;
                        await updateDoc(documentRef, { balance: newAmountInFrom });
                    }
                }
                return isLess;
            }
        } catch (error) {
            console.log("Error occurred: ", error);
            return true; // Default return value indicating an issue
        }
        return true; // Default return value indicating an issue
    }
    
    async function ManageBalanceOnAddingTransactionInToWallet(uid) {
        try {
            const q = query(collection(db, 'wallets'), where('uid', '==', uid), where("id", '==', selectedWalletTo.id));
            const querySnapshot = await getDocs(q);
    
            if (!querySnapshot.empty) {
                for (const doc of querySnapshot.docs) {
                    const item = doc.data();
                    const amount = parseFloat(item.balance);
                    const transferAmount = parseFloat(transferObject.amount);
                    const newAmountInTo = amount + transferAmount;
    
                    const documentRef = doc.ref;
                    await updateDoc(documentRef, { balance: newAmountInTo });
                }
            }
        } catch (error) {
            console.log("Error occurred: ", error);
        }
    }
    
    async function handleSave(uid, selectedWalletTo, walletName) {
        try {
            if(!transferObject.amount){
                showSnackbar('Please fill the details', 'error');
                return;
            }
            if(!transferObject.description){
                showSnackbar('Please fill the details', 'error');
                return;
            }
            if(!transferObject.date){
                showSnackbar('Please fill the details', 'error');
                return;
            }
            let isLess = await ManageBalanceOnAddingTransactionInFromWallet(uid);
            if (!isLess) {
                setShowBackDrop(true);
                await ManageBalanceOnAddingTransactionInToWallet(uid);
                const updatedObject = {
                    ...transferObject,
                    uid: uid,
                    wallet_id_to: selectedWalletTo.id,
                    wallet: walletName,
                    wallet_id_from: wallet_Id
                };
                const docRef = collection(db, 'transactions');
                await addDoc(docRef, updatedObject);
                CloseExpenseTransactionModal(); // Only close modal if balance is sufficient
            }
            setShowBackDrop(false); // Fix typo: should be setShowBackDrop(false) instead of setShowBackDrop(null)
        } catch (error) {
            console.log("Error occurred: ", error);
            setShowBackDrop(false);
        }
    }

    return(
        <>
        <div className="everything">
            <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={showBackDrop}
                >
                    <CircularProgress color="inherit" />
            </Backdrop>
            <div className="from--to--transfer--para">
                <div className="categ--div--title">
                    <p className='categ--title--to'>From</p>
                </div>
                <div className="categ--div--title--to">
                    <p className='categ--title--to--para'>To</p>
                </div>
            </div>
            <div className="from--to--transfer">
                <>
                    <div className='category--Input'>
                    <Autocomplete
                        disabled="true"
                        disablePortal
                        id="combo-box-demo"
                        options={walletArray}
                        value={walletName}
                        clearIcon={null}
                        fullWidth
                        renderInput={(params) => <TextField {...params} placeholder="Select Currency"
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
                                    backgroundColor: backgroundStyles.backgroundColor,
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
                    </div>
                    <i class='bx bx-chevrons-right' id="right"></i>
                    <div className='category--Input'>
                        {/* <Box width="100%" height="2%" className="textField--category--icon--container" > */}
                            <Autocomplete
                        disablePortal
                        id="combo-box-demo"
                        options={availableWallets}
                        value={selectedWalletTo}
                        getOptionLabel={(option)=>option.name}
                        onChange={handleToChange}
                        clearIcon={null}
                        fullWidth
                        renderInput={(params) => <TextField {...params} placeholder="Select Wallet"
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
                                    backgroundColor: backgroundStyles.backgroundColor,
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
                            {/* </Box> */}
                    </div>
                </>
            </div>
                <div className="warn--div">
                    <div className="warni">
                    </div>
                    <div className="warni1">
                    {showToWarn && <p className="warn">Please choose destination wallet</p>}
                    </div>
                </div>
            <div className="amnt--parent--div">
                <p className="title--amnt">Amount</p>
                <div className="amnt--input--currency--type" >
                    <input type='number' value={transferObject.amount} placeholder='0.00' className='amnt--input--number' min="1" onChange={handleAmountChange} style={{fontFamily:'Inter,san-serif'}}></input>
                    <p className='typeOfCurrency--class'>{displayCurrency}</p>
                </div>
                {showAmountWarn && <p className="warn">Kindly Specify the transfer amount</p>}
            </div>
            <div className="info--div">
                <p className="title--descrip">Description</p>
                <input onChange={handleDescriptionChange} value={transferObject.description} type='text' placeholder='Just saved some Money' className='amnt--input' minLength="1" maxLength={30}></input>
            </div>
            {showDescriptionWarn && <p className="warn">Please specify the description</p>}
            <p className="event--date">Event Date</p>
            <div className="date--picker--div">
            <Box style={{width:'100% !important'}}>
                    <LocalizationProvider dateAdapter={AdapterDayjs} >
                        <DatePicker
                            width='100%'
                            className="date--picker"
                            onChange={handleDateChange}
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
                
                <button type='button' className='save' onClick={()=>handleSave(uid,selectedWalletTo,walletName)}>Save</button>
            </div>
            {showDateWarn && <p className="warn">Kindly Specify the transfer date</p>}

        </div>
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
    </>
    )
}