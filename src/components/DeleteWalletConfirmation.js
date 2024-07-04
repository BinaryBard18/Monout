import React, { useContext, useState, useEffect } from 'react';
import "../LimitByCategoryModal.css";
import "../DeleteWalletConfirmation.css";
import '../ReportBug.css';
import { motion } from 'framer-motion';
import AppContext from '../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, deleteDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../Firebase/firebase';
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



export default function DeleteWalletConfirmation(props) {
    const [open,setOpen] = useState(null);
    const { id: paramId } = useParams();
    const [trackInput, setTrackInput] = useState('');
    const [userName, setUserName] = useState(null);
    const { showDeleteWalletConfirmation, setShowDeleteWalletConfirmation, setUid, uid } = useContext(AppContext);
    const navigate = useNavigate();


    useEffect(() => {
        const storedUid = JSON.parse(localStorage.getItem('UID'));
        if (storedUid) {
            setUid(storedUid);
        }
        const name = JSON.parse(localStorage.getItem("userName"));
        if (name) {
            const firstName = name.split(' ')[0];
            setUserName(firstName.toLowerCase());
        }
    }, [setUid]);

    function handleChange(event) {
        const val = event.target.value;
        setTrackInput(val);
    }

    function CloseConfirmationPopUp() {
        setShowDeleteWalletConfirmation(false);
    }

    async function DeleteRelatedTransactions(uid){
        try {
            const q = query(collection(db,'transactions'),where('uid','==',uid),where("wallet_id",'==',paramId));
            const unsubscribe = onSnapshot(q,(snapshot)=>{
                if(!snapshot.empty){
                    snapshot.docs.map(async (doc)=>{
                        const docRef = doc.ref;
                        await deleteDoc(docRef);
                    })
                }
            })
            return unsubscribe;
        } catch (error) {
            console.log("Error occured : ",error);
        }
    }


    async function DeleteTransfersRelated(uid){
        try {
            const q = query(collection(db,'transactions'),where('uid','==',uid));
            const unsubscribe = onSnapshot(q,(snapshot)=>{
                if(!snapshot.empty){
                    snapshot.docs.map(async (doc)=>{
                        if(doc.data().wallet_id_from===paramId || doc.data().wallet_id_to===paramId){
                            const docRef = doc.ref;
                            await deleteDoc(docRef);
                        }
                    })
                }
            })
            return unsubscribe;
        } catch (error) {
            console.log("Error occured : ",error);
        }
    }

    async function PermanentDelete(uid) {
        if (!uid || !paramId) {
            console.log("Error: uid or id is undefined");
            return;
        }
        try {
            setOpen(true);
            const q = query(collection(db, "wallets"), where("uid", '==', uid), where('id', '==', paramId));
            const allDocs = await getDocs(q);
            if (!allDocs.empty) {
                const document = allDocs.docs[0];
                const docRef = document.ref;
                const inputForDelete = `${userName}/${props.name}`;
                if (trackInput === inputForDelete) {
                    await deleteDoc(docRef);
                    await DeleteRelatedTransactions(uid);
                    await DeleteTransfersRelated(uid);
                    CloseConfirmationPopUp();
                    setOpen(null);
                    navigate('/dashboard');
                }
            }
        } catch (error) {
            console.log("Error occurred: ", error);
            setOpen(null);
        }
    }

    return (
        <div className='limit--by--category--parent--div'>
            <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={open}
                >
                    <CircularProgress color="inherit" />
                </Backdrop>
            <motion.div variants={ModalVariant} initial='hidden' animate='visible' className='limit--by--category--child--div'>
                <div className='limit--by--category--title--cross'>
                    <p className='limit--by--category--title'>Caution!</p>
                    <i className='bx bx-x' id="cross1" onClick={CloseConfirmationPopUp}></i>
                </div>
                <div className='underlined'></div>
                <div className='caution'>
                    <p className='caution--message'>
                        Deleting a wallet will permanently remove all associated data,
                        including transactions, balances. 
                        This action cannot be undone
                    </p>
                </div>
                <div className='amount--input--div'>
                    <p className='confirmation--title'>To confirm type "{userName}/{props.name}" in the box below</p>
                    <div className='amount--input--currency--type'>
                        <input className='amount--input' value={trackInput} onChange={handleChange}></input>
                    </div>
                </div>
                <button type='button' className='delete--permanently--button' onClick={()=>PermanentDelete(uid)}>Delete Permanently</button>
            </motion.div>
        </div>
    );
}
