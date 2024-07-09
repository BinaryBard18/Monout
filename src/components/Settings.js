import React, { useContext, useEffect, useState } from "react";
import "../Settings.css";
import "../Preferences.css";
import "../LimitByCategoryModal.css";
import { Snackbar, Alert,Slide } from '@mui/material';
import { styled } from '@mui/system';
import { Box, TextField, MenuItem, Autocomplete } from "@mui/material";
import { countries, currency } from "./countries";
import { motion,AnimatePresence } from "framer-motion";
import AppContext from "../context/AppContext";
import { signOut } from "firebase/auth";
import { auth, db } from "../Firebase/firebase";
import { useNavigate } from "react-router-dom";
import { where,query,orderBy, addDoc, getDoc } from "firebase/firestore";
import { collection, getDocs, onSnapshot, doc, updateDoc, deleteDoc,setDoc,limit } from "firebase/firestore";
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import { nanoid } from "nanoid";
import axios from "axios";
import Backdrop from '@mui/material/Backdrop';
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';


export default function Settings() {

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [walletArray,setWalletArray] = useState([]);
    const [isLoading,setIsLoading] = useState(false);

    const [showDefaultaPopUp,setShowDefaultPopUp] = useState(false);

    const [definedCategoriesArray,setDefinedCategoriesArray] = useState([]);

    const [showCancel, setShowCancel] = useState(false);
    const [isDisabled, setIsDisabled] = useState(true);
    const [updateClicked, setUpdateClicked] = useState(false);
    const [showWarn,setShowWarn] = useState(false);
    const [showSalaryWarn,setShowSalaryWarn] = useState(false);

    const [defaultCategoryLoader,setDeafultCategoryLoader] = useState(false);

    const [defaultCategoriesArray,setDeafultCategoriesArray] = useState([]);

    const [defaultCategoryObject,setDefaultCategoryObject] = useState({
        defaultCategory : null,
        uid : null,
        defaultId : nanoid()
    })

    const [loader,setLoader] = useState(null);
    const [name,setName] = useState(null);
    
    const [object, setObject] = useState({
        payDay: '',
        salary: '',
        currency: ''
    });

    const [currentCurrency,setCurrentCurrency] = useState(null);
    const [newCurrency,setNewCurrency] = useState(null);
    const [showLoader,setShowLoader] = useState(null);

    useEffect(()=>{
        // convertCurrency();
    },[])

    async function convertCurrency(){
        try {
            const response = await axios.get('https://v6.exchangerate-api.com/v6/4d617ca3ff49236303a10804/latest/USD');
            const rates = response.data.conversion_rates;

            //Convert the transactions amount to new currency : 
            const q = query(collection(db,'transactions'),where('uid','==',uid));
            const allTransaction = await getDocs(q);
            const promisesTransactions = [];
            if(!allTransaction.empty){
                allTransaction.docs.forEach(async (doc)=>{
                    const amount = doc.data().amount;
                    const newAmount = convertedAmount(amount,rates);
                    const docRef = doc.ref;
                    promisesTransactions.push(updateDoc(docRef,{amount : newAmount}));
                })
                await Promise.all(promisesTransactions);
            }


            //Convert the subscriptions amount to new currency :
            const w = query(collection(db,'subscriptions'),where('uid','==',uid));
            const allSubs = await getDocs(w);
            const promisesSubs = [];
            if(!allSubs.empty){
                allSubs.docs.forEach(async (doc)=>{
                    const amount = doc.data().amount;
                    const newAmount = convertedAmount(amount,rates);
                    const docRef = doc.ref;
                    promisesSubs.push(updateDoc(docRef,{amount : newAmount}));
                })
                await Promise.all(promisesSubs);
            }

            //Convert the limitsByCategories amount to new currency :
            const e = query(collection(db,'limitsByCategory'),where('uid','==',uid));
            const allLimits = await getDocs(e);
            const promisesLimits = [];
            if(!allLimits.empty){
                allLimits.docs.forEach(async (doc)=>{
                    const limit = doc.data().limit;
                    const spent = doc.data().spent;
                    const newAmountLimits = convertedAmount(limit,rates);
                    const newAmountSpent = convertedAmount(spent,rates);
                    const docRef = doc.ref;
                    promisesLimits.push(updateDoc(docRef,{limit : newAmountLimits,spent : newAmountSpent}));
                })
                await Promise.all(promisesLimits);
            }

            //Convert the wallets amount to new currency :
            const r = query(collection(db,'wallets'),where('uid','==',uid));
            const allWallets = await getDocs(r);
            const promisesWallet = [];
            if(!allWallets.empty){
                allWallets.docs.forEach(async (doc)=>{
                    const amount = doc.data().balance;
                    const newAmount = convertedAmount(amount,rates);
                    const docRef = doc.ref;
                    promisesWallet.push(updateDoc(docRef,{balance : newAmount}));
                })
                await Promise.all(promisesLimits);
            }

            //Convert the monthlySummaries to new Currency : 
            const t = query(collection(db,'monthlySummaries'),where('uid','==',uid));
            const allMonthlySpend = await getDocs(t);
            const promisesMonthlySummary = [];
            if(!allMonthlySpend.empty){
                allMonthlySpend.docs.forEach(async (doc)=>{
                    const totalIncome = doc.data().totalIncome;
                    const newTotalIncome = convertedAmount(totalIncome,rates);
                    const totalExpense = doc.data().totalExpense;
                    const newTotalExpense = convertedAmount(totalExpense,rates);
                    const savings = doc.data().savings;
                    const newSavings = convertedAmount(savings,rates);
                    const docRef = doc.ref;
                    promisesMonthlySummary.push(updateDoc(docRef,{
                        totalIncome : newTotalIncome,
                        totalExpense : newTotalExpense,
                        savings : newSavings
                    }))
                    await Promise.all(promisesMonthlySummary);
                })
            }
            // convertedAmount(amount,rates);
        } catch (error) {
            console.log("Error occured : ",error);
        }
    }

    function convertedAmount(amount, rates) {
        // Calculate conversion
        if(newCurrency!=currentCurrency){
            const convertedAmount = amount * rates[newCurrency] / rates[currentCurrency];
            return convertedAmount; // You can return the converted amount if needed
        }
    }

    const {
        nameOfUser,
        setNameOfUser,
        imageURL,
        setImageURL,
        uid,
        setUid
    } = useContext(AppContext);


    useEffect(()=>{
        const storedUid = JSON.parse(localStorage.getItem('UID'));
        if (storedUid) {
            setUid(storedUid);
        }
        const storedCurrency = JSON.parse(localStorage.getItem("currencyType"));
        if(storedCurrency){
            setObject(prev=>({...prev,currency: storedCurrency}))
            setCurrentCurrency(storedCurrency.label);
        }
    },[])

    useEffect(()=>{
        LimitsByCategory(uid);
        FetchDefaultCategories(uid);
    },[uid])

    async function setDefaultCategories(uid){
        try {
            setDeafultCategoryLoader(true);
            const updatedObject = {...defaultCategoryObject,uid:uid};
            const defaultCategoriesDB = collection(db,'defaultCategories');
            await addDoc(defaultCategoriesDB,updatedObject);
            setDeafultCategoryLoader(false);
        } catch (error) {
            console.log("Some error occured : ",error);
            setDeafultCategoryLoader(false);
        }
    }

    async function RemoveSummaries(uid){
        try {
            const q = query(collection(db,'users'),where('uid','==',uid));
            const allDocs = await getDocs(q);
            if(!allDocs.empty){
                allDocs.forEach(async (doc)=>{
                    const docRef = doc.ref;
                    await deleteDoc(docRef);
                })
            }
        } catch (error) {
            console.log("Cannot remove summaries : ",error);
        }
    }

    async function FetchDefaultCategories(uid){
        try {
            setDeafultCategoriesArray([]);
            const q = query(collection(db,'defaultCategories'),where("uid","==",uid));
            const unsubscribe = onSnapshot(q,(snapshot)=>{
                let defaultArray = [];
                snapshot.docs.forEach((doc)=>{
                    const item = doc.data();
                    defaultArray.push(item);
                })
                setDeafultCategoriesArray(defaultArray);
                console.log(defaultArray);
            })
            return ()=>unsubscribe()
        } catch (error) {
            console.log("Error : ",error);
        }
    }

    async function AddDefaultCategory(){
        if(defaultCategoryObject.defaultCategory){
            await setDefaultCategories(uid);
            setDefaultCategoryObject(prev=>({...prev,defaultCategory:null}))
        }
    }
    // async function FetchCategories(uid){
    //     try {
    //         const q = query(collection(db,'categories'),where('uid','==',uid),orderBy('categoryName'));
    //         const categoryDocumentArray = onSnapshot(q,(snapshot)=>{
    //             let labelCatgeoryArray = [];
    //             const categoryData = snapshot.docs.map((doc)=>{
    //                     const item = doc.data();
    //                     const categoryObject ={
    //                         label : `${item.categoryIcon} ${item.categoryName}`
    //                     }
    //                     labelCatgeoryArray.push(categoryObject);
    //                 })
    //             setDefinedCategoriesArray(labelCatgeoryArray);
    //             console.log(labelCatgeoryArray);
    //         })

    //         return ()=>categoryDocumentArray()
    //     } catch (error) {
    //         console.log("Some Error Occured : ",error);
    //     }
    // }

    async function LimitsByCategory(uid){
        try {
            const q = query(collection(db,'limitsByCategory'),where('uid','==',uid));
            const unsubscribe = onSnapshot(q,(snap)=>{
                if(!snap.empty){
                    let limitsByCategory = [];
                    snap.docs.forEach((doc)=>{
                        const item = doc.data();
                        const categoryObject = {
                            label : item.categoryNameChosen
                        }
                        limitsByCategory.push(categoryObject);
                    })
                    setDefinedCategoriesArray(limitsByCategory);
                }
            })
        } catch (error) {
            console.log("Error occured : ",error);
        }
    }
    

    const transitionPopUp = {
        hidden:{
          opacity:0
        },
        visible:{
          opacity:1,
          transition:{
            duration:0.3
          }
        },
        exit:{
          opacity:0,
          transition:{
            duration:0.3
          }
        }
    }

    function CloseDefaultCategoryPopUp(){
        setShowDefaultPopUp(false);
    }

    function OpenPopUp(){
        setShowDefaultPopUp(true);
        setTimeout(()=>{
            setShowDefaultPopUp(false);
        },7000)
    }

    const backgroundStyles = {
        backgroundColor:'rgba(71, 71, 71, 0.443)',
        color:'rgba(195, 195, 195, 0.956)'
    }
    const fontStyles = {
        color:'rgba(203, 203, 203, 0.956)'
    }

    function formatNumberToKMB(number) {
        // Convert number to absolute value
        let absNumber = Math.abs(number);
    
        // Check if the number's string length is greater than 5
        if (absNumber.toString().length > 5) {
            // Define suffixes for different magnitudes
            const suffixes = ['', 'K', 'M', 'B', 'T']; // You can extend this as needed
    
            // Determine the magnitude
            const magnitude = Math.floor(Math.log10(absNumber) / 3);
    
            // Calculate the scaled number
            let scaledNumber = number / Math.pow(10, magnitude * 3);
    
            // Round the scaled number to 2 decimal places
            scaledNumber = Math.round(scaledNumber * 100) / 100;
    
            // Convert to string without trailing zeros and format
            let formattedNumber = scaledNumber.toLocaleString('en-US', { maximumFractionDigits: Math.max(0, 2 - Math.floor(Math.log10(Math.abs(scaledNumber)))) }) + '' + suffixes[magnitude];
    
            // Return the formatted number with the original sign
            return (number < 0 ? '-' : '') + formattedNumber;
        } else {
            return number.toString();
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
        backgroundColor: 'green',
        color: 'whitesmoke',
    }));

    const SlideTransition = (props) => {
        return <Slide {...props} direction="left" />;
    };
    

    

    const navigate = useNavigate();

    useEffect(() => {
        const storedUid = JSON.parse(localStorage.getItem('UID'));
        if (storedUid) {
            setUid(storedUid);
            bringData(storedUid);
        }
        setNameOfUser(JSON.parse(localStorage.getItem("userName")));
        setImageURL(JSON.parse(localStorage.getItem("userPhoto")));
    }, []);

    async function handleLogOut() {
        try {
            await signOut(auth);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate('/');
        } catch (error) {
            console.log(error);
        }
    }

    async function bringData(uid) {
        await getUserData(uid);
        await getWalletData(uid);
    }


    async function getWalletData(uid){
        try {
            setIsLoading(true)
            const q = query(collection(db,'wallets'),where('uid','==',uid),orderBy('balance'),limit(4));
            const wallets = onSnapshot(q,(snapshot)=>{
                const walletsData = snapshot.docs
                    .map((doc)=>doc.data())
                setWalletArray(walletsData);
                console.log(walletsData);
                setIsLoading(false);
            })
            return ()=>wallets()
        } catch (error) {
            console.log("Error occured : ",error);
            setIsLoading(false);
        }
    }

    async function getUserData(uid){
        try {
            const q = query(collection(db,'users'),where('uid','==',uid));
            onSnapshot(q,(snapshot)=>{
                const userData = snapshot.docs[0];
                if(userData){
                    const user = userData.data();
                    setImageURL(user.photoLink);
                    setName(user.name);
                    setObject({
                        payDay : user.payDay,
                        salary : user.salary,
                        currency : user.currency
                    })
                }
            });
        } catch (error) {
            console.log('Error', error);
        }
    }

    function Downclicked() {
        if(isDisabled) return;
        if (object.payDay === 1) return;
        const updatedDays = parseFloat(object.payDay) - 1;
        setObject(prev => ({ ...prev, payDay: updatedDays }));
    }

    function Upclicked() {
        if(isDisabled) return;
        if (object.payDay === 31) return;
        const updatedDays = parseFloat(object.payDay) + 1;
        setObject(prev => ({ ...prev, payDay: updatedDays }));
    }

    function handleChange(e) {
        let value = e.target.value;
        value = Math.max(1, Math.min(31, parseInt(value) || 0));
        setObject(prev => ({ ...prev, payDay: value }));
    }

    async function updateToUsersDB(uid, object) {
        try {
            const usersCollection = collection(db, 'users');
            const allDocs = await getDocs(usersCollection);
            allDocs.forEach(async (docSnapshot) => {
                if (docSnapshot.data().uid === uid) {
                    const docRef = doc(db, 'users', docSnapshot.id);
                    await updateDoc(docRef, object);
                    setObject(object);
                    localStorage.setItem("currencyType",JSON.stringify(object.currency));
                    setIsDisabled(true);
                }
            });
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    }

    const handleChangeInCurrency = (event, value) => {
        if(value && value.label){
            setObject(prev => ({ ...prev, currency: value }));
            setNewCurrency(value.label);
            localStorage.setItem("currencyType",JSON.stringify(value));
        }
    }

    const handleChangeSalary = (e) => {
        const income = Math.max(0, e.target.value);
        localStorage.setItem("income", income);
        setObject(prev => ({ ...prev, salary: income }));
    }

    async function RemoveTransaactions(uid,element){
        try {
            const q = query(collection(db,element),where('uid','==',uid));
            const allDocs = await getDocs(q);
            if(!allDocs.empty){
                allDocs.forEach(async (doc)=>{
                    const docRef = doc.ref;
                    await deleteDoc(docRef);
                })
            }
        } catch (error) {
            console.log("Error occured : ",error);
        }
    }

    async function DeletingAccount() {
        try {
            setShowLoader(true);
            const usersDB = collection(db, 'users');
            const allDocs = await getDocs(usersDB);
            allDocs.forEach(async (docu) => {
                if (uid === docu.data().uid) {
                    const docRef = doc(db, 'users', docu.id);
                    await deleteDoc(docRef);
                    RemoveTransaactions(uid,'transactions');
                    RemoveTransaactions(uid,'wallets');
                    RemoveTransaactions(uid,'subscriptions');
                    RemoveTransaactions(uid,'limitsByCategory');
                    RemoveTransaactions(uid,'categories');
                    RemoveSummaries(uid);
                    setUid('');
                    localStorage.clear();
                    setShowLoader(null);
                    console.log("UID", uid);
                    handleLogOut();
                }
            });
        } catch (error) {
            console.log("Error : ", error);
            setShowLoader(null);
        }
    }

    function UpdateSettings() {
        setShowCancel(true);
        setUpdateClicked(true);
        setIsDisabled(false);
    }

    function CancelUpdate() {
        setShowCancel(false);
        setUpdateClicked(false);
        setIsDisabled(true);
        bringData(uid);
        setShowWarn(false);
        setShowSalaryWarn(false);
    }

    async function Update() {
        if(object.currency===null){
            setShowWarn(true);
            return;
        }  
        if(object.salary===0){
            setShowSalaryWarn(true);
            return;
        }
        setShowLoader(true);
        await updateToUsersDB(uid, object);
        await convertCurrency(uid);
        setUpdateClicked(false);
        setShowCancel(false);
        setIsDisabled(true);
        setShowLoader(null);
        setShowWarn(false);
        setShowSalaryWarn(false);
        showSnackbar('Settings Updated successfully', 'success');
    }

    return (
        <div className="settings--div">
            <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={showLoader}
                >
                    <CircularProgress color="inherit" />
            </Backdrop>
            <div className="settings--div--left">
                <p className="settings--title">Settings</p>
                <div className="salary--day--div">
                    <p className="salary--div--title">Salary Day</p>
                    <p className="salary--description">Analytics are calculated for one month, starting from the salary day</p>
                    <div className="input--days--container">
                        <input
                            disabled={isDisabled}
                            type="number"
                            style={isDisabled ? backgroundStyles : null}
                            id="days"
                            value={object.payDay}
                            className="input--days"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            maxLength="2"
                            name="days"
                            min="1"
                            max="31"
                            autoComplete="off"
                            onChange={handleChange}
                        />
                        <div className="arrow--div">
                            <i className='bx bx-chevron-up' style={isDisabled ? fontStyles: null} id="up" onClick={Upclicked}></i>
                            <i className='bx bx-chevron-down' style={isDisabled ? fontStyles: null} id="down" onClick={Downclicked}></i>
                        </div>
                    </div>
                </div>

                <div className="change--currency--div">
                    <p className="currency--change--title">Currency</p>
                    <Autocomplete
                        disabled={isDisabled}
                        disablePortal
                        id="combo-box-demo"
                        options={currency}
                        value={object.currency}
                        onChange={handleChangeInCurrency}
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
                    {showWarn && <p className="warn">Please select a currency!</p>}
                </div>

                <div className="input--days--container">
                    <p className="salary">Salary</p>
                    <input
                        disabled={isDisabled}
                        type="text"
                        id="salary"
                        style={isDisabled ? backgroundStyles : null}
                        value={object.salary}
                        className="input--days"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        name="salary"
                        minLength="1"
                        maxLength="16"
                        autoComplete="off"
                        onChange={handleChangeSalary}
                    />
                    {showSalaryWarn && <p className="warn">Please enter your salary !</p>}
                </div>

                <div className="update--settings">
                    <div className="btn--update--cancel">
                        {showCancel && <button type="button" className="cancel" onClick={CancelUpdate}>Cancel</button>}
                        {!updateClicked && <button type="button" className="update" onClick={UpdateSettings}>Update Settings</button>}
                        {updateClicked && <button type="button" className="update" onClick={Update}>Update</button>}
                    </div>
                </div>
                
                <div className="change--currency--div">
                {/* <div className="default--info--icon--div">
                    <p className="currency--change--title">Choose Default 5 categories</p>
                    <i class='bx bx-info-circle' id='info--circle' onClick={()=>OpenPopUp()}></i> 
                    <AnimatePresence>
                        {showDefaultaPopUp && 
                            (<motion.div 
                                variants={transitionPopUp} 
                                initial='hidden' 
                                animate='visible' 
                                exit='exit' 
                                className="default--categories--info--cross--div"
                            >
                                <div className="cross--font--div">
                                    <i class='bx bx-x' id='cross--font' onClick={()=>CloseDefaultCategoryPopUp()}></i>
                                </div>
                                <p className="default--categories--info">
                                    Analysis will be given only for the selected 5 default categories
                                </p>
                            </motion.div>)
                        }        
                    </AnimatePresence>
                    
                </div> */}
                <div className="default--category--autocomplete--div">
                    {/* <Autocomplete
                        disablePortal
                        value={defaultCategoryObject.defaultCategory}
                        id="combo-box-demo"
                        options={definedCategoriesArray}
                        onChange={handleDefaultCategoryChange}
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
                            padding: '9px !important',
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
                    {defaultCategoryLoader && <div className="default--loader">
                        <Stack sx={{ color: 'grey.500' }}>
                            <CircularProgress color="inherit" size={20} />
                        </Stack>
                    </div>} */}
                </div>
                {/* <div className="catgories--chosen">
                    {defaultCategoriesArray.length > 0 ? (
                        defaultCategoriesArray.map((item) => (
                            <div className="category--cross" key={item.defaultId} id={item.defaultId}>
                                <div className="defaultCategoryName--div">
                                    <p className="defaultCategoryName">{item.defaultCategory}</p>
                                </div>
                                <div className="circular--loader--cancel">
                                    {((item.defaultId === loader)&&(item.defaultCategory===name)) && (
                                        <Stack sx={{ color: 'grey.500' }}>
                                            <CircularProgress color="inherit" size={15} />
                                        </Stack>
                                    )}
                                    <i className='bx bx-x' id="cancel" onClick={() => handleDefaultCategoryDelete(item.defaultId,item.defaultCategory)}></i>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="default-message--div">
                            <p className="default--message">Add default categories to get the analysis...</p>
                        </div>
                    )}
                </div> 
                {(defaultCategoriesArray.length<5) && <div className="add--btn--default--div">
                    <button type="button" className="add--button--default" onClick={()=>AddDefaultCategory()}>Add</button>
                </div>} */}
            </div>

                {/* <div className="your--wallet">
                    <p className="your--wallet--title">Your Wallets</p>
                    {isLoading ?
                    <div className="loader--div">
                        <Stack sx={{ color: 'grey.500' }}>
                            <CircularProgress color="inherit" size={20} />
                        </Stack>
                    </div>
                    :
                    <>
                        {walletArray.length > 0 ? (
                            walletArray.map((item) => (
                                <div className="list--your--wallet">
                                <i className='bx bx-grid-vertical' id="gutter"></i>
                                <div>
                                    <p className="wallet--type">{item.name}</p>
                                    <p className="money">{formatNumberToKMB(item.balance)} {object.currency.label}</p>
                                </div>
                            </div>
                        ))
                        ) : (
                            <div className="no--wallets--div--settings">
                                <p className="no--wallets--settings">Your Wallets will be displayed here</p>
                            </div>
                        )}     
                    </>
                    }
                </div> */}
                <div className="remove--account--div">
                    <p className="remove--account--title">Remove Account</p>
                    <p className="remove--account--description">Be aware that removing account will erase all the data you have</p>
                    <button type="button" className="remove-account-button" onClick={DeletingAccount}>Remove account</button>
                </div>
            </div>
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
            <div className="settings--div--right">
                <div className="profile--pic--name">
                    <img src={imageURL} alt="profile" className="profile" />
                    <p className="name">{nameOfUser}</p>
                </div>
                <button type="button" className="sign--out" onClick={handleLogOut}>Sign Out</button>
            </div>
        </div>
    );
}
