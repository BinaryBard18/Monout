import React,{useContext, useState,useEffect} from "react";
import "../AddCategoryModal.css"
import "../LimitByCategoryModal.css"
import '../ReportBug.css';
import { motion } from 'framer-motion';
import { ModalVariant } from "./LimitByCategoryModal";
import AppContext from "../context/AppContext";
import { collection, doc, getDocs, setDoc, where,query, addDoc } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { nanoid } from "nanoid";
import { Snackbar, Alert,Slide } from '@mui/material';
import { styled } from '@mui/system';

export default function AddCategoryModal(){


    const {showAddCategoryModal,setShowAddCategoryModal,uid,setUid} = useContext(AppContext);
    const [categoryObject,setCategoryObject] = useState({
        categoryName : '',
        categoryIcon : '',
        uid : '',
        emoji : '',
        categoryId : nanoid()
    });
    const [emojiErr,setEmojiErr] = useState(false);//when no emoji is added
    const [nameErr,setNameErr] = useState(false);//when no name is input
    const [categoryExist,setCategoryExist] = useState(false);
    const [open,setOpen] = useState(false);


    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    useEffect(() => {
        const storedUid = JSON.parse(localStorage.getItem('UID'));
        if (storedUid) {
            setUid(storedUid);
        }
    }, []);

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


    function CloseAddCategoryModal(){
        setShowAddCategoryModal(false);

    }    

    async function UpdateCategoryListToDB(){
        try {
            const updateCategoryObject = {...categoryObject,uid:uid}
            const categoryRef = collection(db,'categories');
            await addDoc(categoryRef,updateCategoryObject);
        } catch (error) {
            console.log("Some Error occured : ",error);
        }
    }    

    function handleCategoryNameChange(event){
        const name = event.target.value;
        if(name.trim().length>0){
            setCategoryObject(prev=>({...prev,categoryName:name.trim()}));
            setNameErr(false);
        }else{
            setNameErr(true);
        }
    }

    async function CheckIfCategoryExists(uid){
        try {
            const q = query(collection(db,'categories'),where('uid','==',uid));
            const snapshot  = await getDocs(q);
            let exists = false
            snapshot.docs.forEach((doc)=>{
                const element = doc.data()
                if(element.categoryName.toLowerCase()===categoryObject.categoryName.toLowerCase()){
                    exists = true;
            }
        });
            return exists;
        } catch (error) {
            console.log("Error : ",error);
        }
        
    }

    function handleEmojiChange(event) {
        const emoji = event.target.value;
        if (emoji && emoji.trim().length > 0) {
          setCategoryObject((prev) => ({ ...prev, categoryIcon: emoji }));
          setEmojiErr(false);
        } else {
          setEmojiErr(true);
        }
      }

    async function AddCategoryToDB(){
        //start backdrop
        setOpen(true);
        if(!categoryObject.categoryName && !categoryObject.categoryIcon){
            setNameErr(true);
            setEmojiErr(true);
            return
        }
        if(!categoryObject.categoryName){
            setNameErr(true);
            return;
        };
        if(categoryObject.categoryIcon.length===0){
            setEmojiErr(true);
            return;
        }
        const exist = await CheckIfCategoryExists(uid);
        if(exist){
        showSnackbar('Category Already Exists', 'error');
            setCategoryExist(true)
            return;
        }
        UpdateCategoryListToDB();
        setShowAddCategoryModal(false);
        setNameErr(false);
        setEmojiErr(false);
        setOpen(null);//backdrop ends
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
                        <p className='limit--by--category--title'>Add Category</p>
                        <i class='bx bx-x' id="cross1" onClick={()=>CloseAddCategoryModal()}></i>
                    </div>
                    <div className='underlined'>

                    </div>
                    <>
                    
                    </>

                    <div className='amount--input--div'>
                        <p className='amount--title'>Name<span> *</span></p>
                        <div className='amount--input--currency--type '>
                            <input type='text' maxLength={20} placeholder='eg.Entertainment' className='amount--input name--input--box' onChange={handleCategoryNameChange} ></input>
                        </div>
                        {nameErr && <p className="warn">Please specify the category name</p>}
                    </div>
                    <div className='amount--input--div'>
                        <p className='amount--title'>Emoji<span> *</span></p>
                        <div className='amount--input--currency--type '>
                            <input type='text' placeholder='Select emoji (Windows key + . )' className='amount--input name--input--box' onChange={handleEmojiChange}></input>
                        </div>
                        {emojiErr && <p className="warn">Please choose an emoji that represents your category</p>}
                    </div>
                    <button type='button' className='save--button' onClick={()=>AddCategoryToDB()}>Save</button>
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
