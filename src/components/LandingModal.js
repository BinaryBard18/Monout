import React, { useContext, useEffect, useState } from 'react';
import "../LimitByCategoryModal.css";
import "../LandingModal.css";
import {  TextField, Autocomplete } from "@mui/material";
import '../ReportBug.css';
import { countries, currency } from './countries';
import { motion } from 'framer-motion';
import { db } from '../Firebase/firebase';
import AppContext from '../context/AppContext';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import dayjs from 'dayjs';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

export const ModalVariant = {
    hidden: {
        y: '-250px',
        opacity: 0
    },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 100
        }
    },
    exit: {
        y: '-250px',
        transition: {
            type: 'spring',
            stiffness: 100
        }
    }
};

export default function LimitByCategoryModal() {

    const [obj,setObj] = useState({
        payDay:'1',
        salary : '',
        currency:'',
        startDate : dayjs().format("MMMM DD,YYYY"),
        joinDate : dayjs().format("MMMM DD,YYYY"),
        joinMonth : dayjs().format('MMMM'),
        resetDate : dayjs().add(1,'month').format("MMMM DD,YYYY")
    })

    const [showMessage,setShowMessage] = useState(false);
    const [showSalaryMessage,setShowSalaryMessage] = useState(false);
    const [showPayDay,setShowPayDay] = useState(false);
    const [showBackDrop,setShowBackDrop] = useState(null);

    const { showLimitsModal, 
            setShowLimitsModal, 
            showLandingModal, 
            setShowLandingModal, 
            setNameOfUser, 
            imageURL, 
            setImageURL, 
            uid, 
            setUid, 
        } = useContext(AppContext);

    useEffect(() => {
        const storedUid = JSON.parse(localStorage.getItem('UID'));
        if (storedUid) {
            setUid(storedUid);
        }
    }, []);

    const styleOfDownWhenZeroDays = {
        color: 'grey'
    };

    function Downclicked() {
        if (obj.payDay === 1) return;
        const updatedDays = obj.payDay - 1;
        setObj(prev=>({...prev,payDay:updatedDays}))
    }

    function Upclicked() {
        if (obj.payDay === 31) return;
        const updatedDays = obj.payDay + 1;
        setObj(prev=>({...prev,payDay:updatedDays}))
    }

    function handleChange(e) {
        const value = e.target.value;
        if (value === "" || (Number(value) >= 1 && Number(value) <= 31)) {
            setObj(prev=>({...prev,payDay:value}))
        }
    }

    const handleCurrencyChange = (event, value) => {
        setObj(prev => ({ ...prev, currency: value ? value.label : '' }));
        localStorage.setItem("currencyType",JSON.stringify(value))
    };

    const handleChangeSalary = (e) => {
        const income = Number(e.target.value);
        setObj(prev=>({...prev,salary:income}))

    };

    async function updateToUsersDB(uid, obj) {
        const usersCollection = collection(db, 'users');
        const allDocs = await getDocs(usersCollection);
    
        allDocs.forEach(async (docSnapshot) => {
            if (uid === docSnapshot.data().uid) {
                const docRef = doc(db, 'users', docSnapshot.id);
                try {
                    await updateDoc(docRef, obj);
                    console.log(`Document with UID ${uid} updated successfully.`);
                    return; // return after successful update
                } catch (error) {
                    console.error("Error updating document: ", error);
                    return; // return after logging error
                }
            }
        });
    }

    function SaveBasicInformation() {
        if (!obj.currency) {
            setShowMessage(true);
            return;
        }
        if (!obj.salary) {
            setShowSalaryMessage(true);
            return;
        }
        if (!obj.payDay) {
            setShowPayDay(true);
            return;
        }
        setShowBackDrop(true);
        updateToUsersDB(uid, obj);
        localStorage.removeItem("LandingModalValue");
        setShowMessage(false);
        setShowSalaryMessage(false);
        setShowPayDay(false);
        setShowLandingModal(false);
        setShowBackDrop(null);
    }

    return (
        <div className='limit--by--category--parent--div'>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={showBackDrop}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <motion.div variants={ModalVariant} initial='hidden' animate='visible' className='limit--by--category--child--div'>
                <div className='limit--by--category--title--cross'>
                    <p className='limit--by--category--title'>Basic Information</p>
                </div>
                <div className='underlined'></div>
                <div className='information--changing'>
                    <p className='change--info'>You can anytime change these in Settings</p>
                </div>
                <div className="change--currency--div">
                    <p className="currency--change--title currency--color">Currency<span> *</span></p>
                    <Autocomplete
                        disablePortal
                        id="combo-box-demo"
                        options={currency}
                        fullWidth
                        onChange={handleCurrencyChange}
                        renderInput={(params) => (
                            <TextField {...params}
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
                            />
                        )}
                    />
                    {showMessage && <p className='warn'>Select your preferred currency</p>}
                </div>
                <div className='salary--day--div'>
                    <p className='salary--input'>Salary Day<span> *</span></p>
                    <div className="input--days--container">
                        <input
                            type="text"
                            id="days"
                            value={obj.payDay}
                            autoComplete='off'
                            className="input--days"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            maxLength="2"
                            name="days"
                            min="1"
                            max="31"
                            onChange={handleChange}
                        />
                        <div className="arrow--div">
                            <i className='bx bx-chevron-up' id="up" onClick={Upclicked}></i>
                            <i className='bx bx-chevron-down' id="down" style={obj.payDay === 1 ? styleOfDownWhenZeroDays : null} onClick={Downclicked}></i>
                        </div>
                    </div>
                    {showPayDay && <p className='warn'>Select your preferred currency</p>}
                </div>
                <div className='amount--input--div'>
                    <p className='amount--title'>Your Monthly Salary<span> *</span></p>
                    <div className='amount--input--currency--type'>
                        <input type='number' placeholder='0.00' className='amount--input input--amounnt' autoComplete='off' onChange={handleChangeSalary}></input>
                        <p className='currency--type'>{obj.currency}</p>
                    </div>
                    {showSalaryMessage && <p className='warn'>Select your preferred currency</p>}
                </div>
                <button type='button' className='save--basic--info--button' onClick={()=>SaveBasicInformation()}>Save</button>
            </motion.div>
        </div>
    )
}
