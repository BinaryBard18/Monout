import React,{useContext, useState,useEffect} from "react";
import "../Wallets.css"
import "../WalletsRightPart.css"
import others from "../others.png"
import { collection, onSnapshot, query, where,getDocs, deleteDoc ,updateDoc,writeBatch,doc} from 'firebase/firestore';
import { db } from '../Firebase/firebase';
import {motion,AnimatePresence } from "framer-motion"
import AppContext from "../context/AppContext";
import emojiRegex from "emoji-regex";
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import SubscriptionTransfer from "./SubscriptionTransfer";
import defaultImage from "../other.png"
import dayjs from "dayjs";
import { useParams } from "react-router-dom";

export default function WalletsRightPart(){

  const [pending,setPending] = useState(null);

  useEffect(()=>{
    const currentDate = dayjs();
    const endOfMonth = currentDate.endOf('month');

    const pendingDays = endOfMonth.diff(currentDate, 'day');
    setPending(pendingDays)
  },[])

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

  const [isHovered,setIsHovered] = useState(false);
  const [catArray1,setCatArray1] = useState([]);
  const [catArray2,setCatArray2] = useState([]);
  const [showOthers,setShowOthers] = useState(null);
  const [showProgressor,setShowProgressor] = useState(true);//made true so that nothing found pehle nai dikhe
  const [trackDelete,setTrackDelete] = useState(null);
  const [editClicked,setEditClicked] = useState(false);
  const [subscriptionClicked,setSubscriptionClicked] = useState(null)
  const [newLimit,setNewLimit] = useState({
        limit : 0
  });
  const [invalidLimit,setInvalidLimit] = useState(false);
  const [displayCurrency,setDisplayCurrency] = useState('');
  const [showSubscriptionLoader,setShowSubscriptionLoader] = useState(true);//made true so that nothing found pehle nai dikhe
  const [showSubscriptionDeleteLoader,setShowSubscriptionDeleteLoader] = useState(null);

  const styleBorder = {
    border : '0.5px solid red'
  }

  const {showLimitsModal,
    setShowLimitsModal,
    showSubscriptionModal,
    setShowSubscriptionModal,
    showDropDown,
    setShowDropDown,
    showConfirmSubscriptionTransfer,
    setShowConfirmSubscriptionTransfer,
    uid,
    setUid
  } = useContext(AppContext);

  const {id} = useParams();
  
  const [limitCategoryClickedId,setLimitCategoryClickedId] = useState(null);
  const [subscriptionArray1,setSubscriptionArray1] = useState([]);
  const [subscriptionArray2,setSubscriptionArray2] = useState([]);
  const [showAll,setShowAll] = useState(false);
  const [startDate,setStartDate] = useState('');


  function infoClicked(){
    setIsHovered(true);
    setTimeout(()=>{
      setIsHovered(false);
    },7000)
  }
  // const [day,setDay] = useState(null);

  useEffect(()=>{
    // const dayFromStorage = (JSON.parse(localStorage.getItem('')))
    setUid(JSON.parse(localStorage.getItem("UID")))
    const storedCurrency = JSON.parse(localStorage.getItem("currencyType"));
      if(storedCurrency){
        setDisplayCurrency(storedCurrency.label);
      }
    
    const start = (localStorage.getItem('startDate'));
    if(start){
      setStartDate(start);
    }  


  },[]);

  useEffect(()=>{
    fetchLimitsByCategory(uid);
    fetchSubscriptionDetails(uid);
    CheckIfRenewalDateReached(uid)
  },[uid]);

  useEffect(()=>{
    fetchTransactionAndDisplay(uid);
  },[uid,id])

  const DropDownVariants = {
    hidden:{
      height:0,
      opacity:0,
      overflow: 'hidden',
    },
    visible: {
      height: 'auto',
      opacity: 1,
      overflow: 'hidden',
      transition: {
        height: { duration: 0.2, ease: 'easeInOut' },
        opacity: { duration: 0.2, ease: 'easeInOut' },
      }
    },
    exit: {
      height: 0,
      opacity: 0,
      overflow: 'hidden',
      transition: {
        height: { duration: 0.2, ease: 'easeInOut' },
        opacity: { duration: 0.2, ease: 'easeInOut' },
      }
    }
  }

  async function CheckIfRenewalDateReached(){
    try {
      const q = query(collection(db,'subscriptions'),where('uid','==',uid));
      const unsubscribe = onSnapshot(q,(snapshot)=>{
        if(!snapshot.empty){
          snapshot.docs.map(async (doc)=>{
            const item = doc.data();
            const renewalDate = dayjs(item.renewalDate);
            const currentDate = dayjs();
            if(currentDate.isAfter(renewalDate)){
              const updateObject = {
                status : 'pending'
              }
              const docRef = doc.ref;
              await updateDoc(docRef,updateObject);
            }
          })
        }
        return ()=>unsubscribe();
      })
    } catch (error) {
      console.log("Error occure : ",error);
    }
  }

  async function fetchLimitsByCategory(uid){
    try {
        setShowProgressor(true);
        const q = query(collection(db, 'limitsByCategory'), where('uid', '==', uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                let arrayOfObjects = [];
                snapshot.docs.forEach((doc) => {
                    const item = doc.data();
                    
                    const regex = emojiRegex();
                    const match = item.categoryNameChosen.match(regex);
                    let emoji = '';
                    const colorObject = item.color;
                    let text = item.categoryNameChosen;

                    if (match) {
                        emoji = match[0];
                        text = item.categoryNameChosen.replace(emoji, '').trim();                        
                        const object = {
                            color: colorObject, // Use colorObject
                            catName: text,
                            emoji: emoji,
                            limit: item.limit,
                            spent: item.spent,
                            suggestSpend: item.suggestSpend,
                            id: item.id,
                            typeOfTransaction : item.typeOfTransaction
                        };
                        
                        arrayOfObjects.push(object);
                    }
                });
                if(arrayOfObjects.length>4){
                  const newArray = arrayOfObjects;
                  const array1 = newArray.splice(0,4);//contains the first 4 elements
                  const array2 = newArray;//contains remaining elements
                  setCatArray1(array1);
                  setCatArray2(array2);
                  setShowProgressor(null);
                  setShowOthers(false);

                }else{
                  setCatArray1(arrayOfObjects);
                  setCatArray2([]);
                  setShowProgressor(null)
                }
            }else{
              setShowProgressor(false)
            }
        });

        return ()=>unsubscribe();
    } catch (error) {
        console.log('Error occurred in fetchLimitsByCategory:', error);
        setShowProgressor(null)
    }
}

  function Cancel(){
    setIsHovered(false);
  }

  async function UpdateNewLimit(id,newLimit){
    try {
      // if()
      if(!newLimit.limit) {
        return;
      }
        
      setTrackDelete(id)
      const q = query(collection(db, 'limitsByCategory'), where('id', '==', id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, newLimit);
        setTrackDelete(null);
        //If You dont want the drop down to close you may comment the below line :         
        setLimitCategoryClickedId(prevId => prevId === id ? null : id);
        setEditClicked(null)
      }
    }catch (error) {
        console.log("Error occured : ",error);
        setTrackDelete(null)
      }
    }

  function handleOthersOpen(){
    setShowOthers(prev=>!prev);
  }

  function OpenLimitsModal(){
    setShowLimitsModal(true);
  }

  function OpenSubscriptionModal(){
    setShowSubscriptionModal(true);
  }

  async function fetchSubscriptionDetails(uid){
    try {
      setShowSubscriptionLoader(true);
      const q = query(collection(db,'subscriptions'),where('uid','==',uid));
      const unsubscribe = onSnapshot(q,(snapshot)=>{
        let allSubscriptions = [];
        if(!snapshot.empty){
          snapshot.docs.map((doc)=>{
            const item = doc.data();
            allSubscriptions.push(item);
          })
          if(allSubscriptions.length>4){
            const newArray = allSubscriptions;
            const array1 = newArray.splice(0,4);
            const array2 = newArray;
            // console.log(array1 , "array 1")
            // console.log(array2 , "array 2")
            setSubscriptionArray1(array1);
            setSubscriptionArray2(newArray);
            setShowSubscriptionLoader(null);
          }else{
            setSubscriptionArray1(allSubscriptions);
            setSubscriptionArray2([]);
            setShowSubscriptionLoader(null);
          }
        }else{
          setShowSubscriptionLoader(null)
        }
        return ()=>unsubscribe();
      })
    } catch (error) {
      console.log("Error occured : ",error);
      setShowSubscriptionLoader(null);
    }
  }

  async function handleDeleteLimitByCategory(id){
    try {
      setTrackDelete(id);
      const q = query(collection(db,"limitsByCategory"),where('id','==',id));
      const document = await getDocs(q);
      if(!document.empty){
        const docSnapshot = document.docs[0];
        await deleteDoc(docSnapshot.ref);
        setCatArray1(prevArray => prevArray.filter(item => item.id !== id));
        setCatArray2(prevArray => prevArray.filter(item => item.id !== id));
        setTrackDelete(null);
      }
    } catch (error) {
      console.log("Error occured : ", error);
      setTrackDelete(null);
    }
  }

  function DropDown(id){
    setShowDropDown(prev=>!prev)
    setLimitCategoryClickedId(prevId => prevId === id ? null : id);
  }
  
  function OpenSubscriptionConfirmation(id){
    setShowConfirmSubscriptionTransfer(true);
    setSubscriptionClicked(id)
  }

  function  UpdateCancel(){
    setEditClicked(null)
  }

  function UpdateLimitByCategory(id,limit){
    setEditClicked(id);
    setNewLimit(prev=>({...prev,limit:limit}));
  }

  function handleNewLimitAmountChange(event){
    const val = event.target.value;
    if(!val){
      setInvalidLimit(true);
    }else{
      setInvalidLimit(false);
    }
    setNewLimit(prev=>({...prev,limit:val}));
  }

  async function handleDeleteSubscription(id){
    try {
      setShowSubscriptionDeleteLoader(id);
      const q = query(collection(db,'subscriptions'),where('id','==',id));
      const docSnapshot = await getDocs(q);
      if(!docSnapshot.empty){
        const docSnap = docSnapshot.docs[0];
        const docRef = docSnap.ref;
        await deleteDoc(docRef);
        setSubscriptionArray1(prevArray =>
          prevArray.filter(item => item.id !== id)
        );
        setShowSubscriptionDeleteLoader(null);
      }
    } catch (error) {
      console.log("Error occured : ",error);
      setShowSubscriptionDeleteLoader(null);
    }
  }

  function handleShowAllClick(){
    setShowAll(prev=>!prev)
  }

async function fetchTransactionAndDisplay(uid) {
    const q = query(collection(db, 'transactions'), where('uid', '==', uid), where('typeOfTransaction', '!=', 'transfer'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
            if (!snapshot.empty) {
                let transaction = [];

                snapshot.docs.forEach((doc) => {
                    const item = doc.data();
                    const transactionDate = dayjs(item.date, "MMMM DD,YYYY");
                    const startDateObj = dayjs(startDate, "MMMM DD,YYYY");

                    console.log('Transaction Date:', transactionDate.format("MMMM DD,YYYY"));
                    console.log('Start Date:', startDateObj.format("MMMM DD,YYYY"));

                    if (transactionDate.isAfter(startDateObj)||transactionDate.isSame(startDateObj)) {
                        console.log("Transaction after start date:", item.date, "Category:", item.category);
                        
                        if (item.category) {
                            const regex = emojiRegex();
                            const match = item.category.match(regex);
                            let emoji = '';
                            let text = item.category;
                            if (match) {
                                emoji = match[0];
                                text = item.category.replace(emoji, '').trim();
                            }
                            const object = {
                                ...item,
                                text: text,
                                emoji: emoji
                            };
                            transaction.push(object);
                        }
                    }
                });

                const groupedData = transaction.reduce((acc, curr) => {
                    const { text, amount, typeOfTransaction, category } = curr;
                    const amountNumber = parseFloat(amount);
                    const existing = acc.find((item) => item.description === text);
                    if (existing) {
                        existing.totalSpend += amountNumber;
                    } else {
                        acc.push({
                            categoryNameChosen: category,
                            description: text,
                            typeOfTransaction: typeOfTransaction,
                            totalSpend: amountNumber,
                        });
                    }
                    return acc;
                }, []);

                await batchUpdateLimits(uid, groupedData);
                console.log("Grouped Data:", groupedData);
            }
        } catch (error) {
            console.log("Error occurred: ", error);
        }
    });
}

  async function fetchCategoryToDocIdMap(uid) {
    try {
        const categoryToDocIdMap = {};
        const q = query(collection(db, 'limitsByCategory'), where('uid', '==', uid));
        const docSnapshots = await getDocs(q);
        docSnapshots.forEach((doc) => {
            const item = doc.data();
            const category = item.categoryNameChosen;
            if (category) {
                categoryToDocIdMap[category] = doc.id;
            }
        });
        return categoryToDocIdMap;
    } catch (error) {
        console.log("Error occurred: ", error);
        throw error; // Propagate the error to handle it appropriately
    }
}

  async function batchUpdateLimits(uid, groupedData) {
    try {
        const categoryToDocIdMap = await fetchCategoryToDocIdMap(uid);
        if (categoryToDocIdMap) {
            const batch = writeBatch(db);
            groupedData.forEach((document) => {
                const { categoryNameChosen, totalSpend,typeOfTransaction } = document;
                const docId = categoryToDocIdMap[categoryNameChosen];
                if (docId) {
                    const docRef = doc(db, 'limitsByCategory', docId);
                    batch.update(docRef, { spent: totalSpend,typeOfTransaction : typeOfTransaction });
                }
            });

            await batch.commit();
            // console.log("Batch update complete.");
        }
    } catch (error) {
        console.log("Error occurred: ", error);
        throw error; // Propagate the error to handle it appropriately
    }
}

function formatAmount(amount){
  if(amount<0 || amount===0){
    return 0;
  }
  else{
    const result = Math.abs(amount);
    return result;
  }
}

    return(
        <>
       
        {/* <div className='expected--balance--days--before--salary--div'>
          <div className='expected--balance'>
            <p className='expected--balance--title'>Expected Balance</p>
            <p className='amnt'>4588.11 {displayCurrency}</p>
          </div>
          <div className="days--before--salary--parent--div">
            <div className='days--before--salary--div'>
              <div className='days--before--salary--title--info--div'>
                <p className='days--before--salary--title'>Days before Salary</p>
                <i onClick={()=>infoClicked()} class='bx bx-info-circle' id='info--circle'></i>
              </div>
              <p className='no--of--days'>6 days</p>
            </div>
            <AnimatePresence>
                {isHovered && 
                  (<motion.div 
                    variants={transitionPopUp} 
                    initial='hidden' 
                    animate='visible' 
                    exit='exit' 
                    className={`info--pop--up--div ${isHovered ? 'active' : ''}`}
                  >
                    <div className="cross-icon">
                      <i class='bx bx-x' id="cross" onClick={()=>Cancel()}></i>
                    </div>
                    <div className="info--pop--up--content--div">
                      <p className="info--pop--up--content">
                        Adjust this setting based on when
                        your salary is credited to your
                        account to ensure accurate financial analytics.
                      </p>
                    </div>
                  </motion.div>)}
              </AnimatePresence>
          </div>
        </div> */}
        <div className='limits--by--category'>
            <div className='limits--by--category--plus--icon'>
                <p className='limits--by--category--title'>Limit by Category</p>
                <i class='bx bx-plus' id='plus' onClick={()=>OpenLimitsModal()} ></i>
            </div>


              {showProgressor && 
                <div className="progressor">
                  <Stack sx={{ color: 'grey.500' }}>
                    <CircularProgress color="inherit" size={20} />
                  </Stack>
                </div>}
            {catArray1.length > 0 ? (
              catArray1.map((item) => (
                <div className='child--limits--by--category' key={item.id}>
                  <div className="emoji--name--spent--bar--div">
                    <p className="pizza10">{item.emoji}</p>
                    <div className='category--money--bar'>
                      <div className='category--type--money--left'>
                        <p className='category--type'>{item.catName}</p>
                        <p className='money--left'>{Math.abs((item.limit-item.spent).toFixed(2))} {displayCurrency} <span>{!(item.spent>item.limit) ? 'left' : 'exceeded'}</span></p>
                      </div>
                      <div className='bar--div' style={{ backgroundColor: item.color?.outer || 'transparent' }}>
                        <div className='bar' style={{ backgroundColor: item.color?.fill || 'transparent', width: `${(item.spent / item.limit) * 100}%`, borderRadius : '5px' }}></div>
                      </div>
                    </div>
                    <i className={limitCategoryClickedId===item.id ? 'bx bx-chevron-up' : 'bx bx-chevron-down'} id='down1' onClick={() => DropDown(item.id)}></i>
                  </div>

                  {/* FoodDrop */}
                  <AnimatePresence>
                    {limitCategoryClickedId === item.id && (
                      <motion.div key={item.id} variants={DropDownVariants} initial='hidden' animate='visible' exit='exit' className="food-dropdown">
                        <div className="loader--limit--div">
                          {!(editClicked===item.id) && <p className="total--limit--info">Your total limit is <span>{Math.abs(formatAmount(item.limit).toFixed(2))} {displayCurrency}</span></p>}
                          {(editClicked===item.id) && <p className="total--limit--info">Your total limit is <span><input value={newLimit.limit} style={invalidLimit ? styleBorder : null} onChange={handleNewLimitAmountChange} className="input--limit--amount" type='number'></input> {displayCurrency}</span></p>}
                          {(trackDelete===item.id) && <div className="loader--limit">
                            <Stack sx={{ color: 'grey.500' }}>
                              <CircularProgress color="inherit" size={15} />
                            </Stack>
                          </div>}
                        </div>
                        {item.typeOfTransaction==='income' ? 
                          <p className="spent--amount--info">Earned <span>{formatAmount(item.spent).toFixed(2)} {displayCurrency}</span> already</p>
                          :
                          <p className="spent--amount--info">Spent <span>{formatAmount(item.spent).toFixed(2)} {displayCurrency}</span> already</p>
                        }

                        {item.typeOfTransaction==='income' ? 
                          <p className="recommend--spend--info">Earn more than <span>{Math.abs(formatAmount((item.limit-item.spent)/pending).toFixed(2))} {displayCurrency}</span> per day</p>
                          :
                          <p className="recommend--spend--info">Spend less than <span>{Math.abs(formatAmount((item.limit-item.spent)/pending).toFixed(2))} {displayCurrency}</span> per day</p>
                        }
                        <div className="edit--remove--button">
                          {!(editClicked === item.id) && 
                            <>
                              <button type="button" className="edit--button" onClick={()=>UpdateLimitByCategory(item.id,item.limit)}>Edit</button>
                              <button type="button" className="remove--button" onClick={()=>handleDeleteLimitByCategory(item.id)}>Remove</button>
                            </>
                          }

                          {(editClicked === item.id) && 
                            <div className="update--cancel--div">
                              <button type="button" className="edit--button check-btn" onClick={()=>UpdateNewLimit(item.id,newLimit)}><i class='bx bx-check' style={{fontSize:'1rem'}}></i></button>
                              <button type="button" className="edit--button x-btn" onClick={()=>UpdateCancel()}><i class='bx bx-x' style={{fontSize:'1rem'}} ></i></button>
                            </div>
                          }
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* FoodDrop */}
                </div>
              ))
              ) : 
                !showProgressor && (<div className="progressor"><p className="nothing">Nothing found... Add one</p></div>)
            }
            
            
            {/* Others limits By Category  */}
            {/* When the catArray1 ka length will become 5 tab i will show others  */}
            {(catArray2.length>0) && 
            <div>
            <div className='child--limits--by--category'>
              <div className="emoji--name--spent--bar--div">
                <img src={others} className='pizza1' alt='broken' draggable={false}></img>
                <div className='category--money--bar'>
                  <div className='category--type--money--left'>
                    <p className='category--type'>Others</p>
                    {/* <p className='money--left'>3577.46 {displayCurrency} <span>left</span></p> */}
                  </div>
                </div>
                <i class={showOthers ? 'bx bx-chevron-up' : 'bx bx-chevron-down'} id='down1' onClick={()=>handleOthersOpen()} ></i> 
              </div>
            </div>

              {catArray2.length > 0 && showOthers ? (
              catArray2.map((item) => (
                <div className='child--limits--by--category' key={item.id}>
                  <AnimatePresence>

                    {showOthers && (<motion.div className="others--div" variants={DropDownVariants} initial='hidden' animate='visible' exit='exit'>
                        <div className="emoji--name--spent--bar--div">
                          <p className="pizza10">{item.emoji}</p>
                          <div className='category--money--bar'>
                            <div className='category--type--money--left'>
                              <p className='category--type'>{item.catName}</p>
                              <p className='money--left'>{Math.abs(formatAmount(item.limit-item.spent).toFixed(2))} {displayCurrency} <span>left</span></p>
                            </div>
                            <div className='bar--div' style={{ backgroundColor: item.color?.outer || 'transparent' }}>
                        <div className='bar' style={{ backgroundColor: item.color?.fill || 'transparent', width: `${(item.spent / item.limit) * 100}%`, borderRadius : '5px' }}></div>
                      </div>
                          </div>
                          <i className={limitCategoryClickedId===item.id ? 'bx bx-chevron-up' : 'bx bx-chevron-down'} id='down1' onClick={() => DropDown(item.id)}></i>
                        </div>
                      </motion.div>)}

                  </AnimatePresence>

                  {/* FoodDrop */}
                  <AnimatePresence>
                    {limitCategoryClickedId === item.id && (
                      <motion.div key={item.id} variants={DropDownVariants} initial='hidden' animate='visible' exit='exit' className="food-dropdown">
                        <div className="loader--limit--div">
                          {!(editClicked===item.id) && <p className="total--limit--info">Your total limit is <span>{Math.abs(formatAmount(item.limit).toFixed(2))} {displayCurrency}</span></p>}
                          {(editClicked===item.id) && <p className="total--limit--info">Your total limit is <span><input value={newLimit.limit} style={invalidLimit ? styleBorder : null} onChange={handleNewLimitAmountChange} className="input--limit--amount" type='number'></input> {displayCurrency}</span></p>}
                          {(trackDelete===item.id) && <div className="loader--limit">
                            <Stack sx={{ color: 'grey.500' }}>
                              <CircularProgress color="inherit" size={15} />
                            </Stack>
                          </div>}
                        </div>
                        {item.typeOfTransaction==='income' ? 
                          <p className="spent--amount--info">Earned <span>{formatAmount(item.spent).toFixed(2)} {displayCurrency}</span> already</p>
                          :
                          <p className="spent--amount--info">Spent <span>{formatAmount(item.spent).toFixed(2)} {displayCurrency}</span> already</p>
                        }

                        {item.typeOfTransaction==='income' ? 
                          <p className="recommend--spend--info">Earn more than <span>{Math.abs(formatAmount((item.limit-item.spent)/pending).toFixed(2))} {displayCurrency}</span> per day</p>
                          :
                          <p className="recommend--spend--info">Spend less than <span>{Math.abs(formatAmount((item.limit-item.spent)/pending).toFixed(2))} {displayCurrency}</span> per day</p>
                        }
                        <div className="edit--remove--button">
                          {!(editClicked === item.id) && 
                            <>
                              <button type="button" className="edit--button" onClick={()=>UpdateLimitByCategory(item.id,item.limit)}>Edit</button>
                              <button type="button" className="remove--button" onClick={()=>handleDeleteLimitByCategory(item.id)}>Remove</button>
                            </>
                          }

                          {(editClicked === item.id) && 
                            <div className="update--cancel--div">
                              <button type="button" className="edit--button check-btn" onClick={()=>UpdateNewLimit(item.id,newLimit)}><i class='bx bx-check' style={{fontSize:'1rem'}}></i></button>
                              <button type="button" className="edit--button x-btn" onClick={()=>UpdateCancel()}><i class='bx bx-x' style={{fontSize:'1rem'}} ></i></button>
                            </div>
                          }
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* FoodDrop */}
                </div>
              ))
            ) : (
              <></>
            )}
            </div>}


          </div>

          <div className='subscription--div'>
            <div className='subscription--title--plus'>
                  <p className='subscription--title'>Subscriptions</p>
                  <i class='bx bx-plus' id='plus' onClick={()=>OpenSubscriptionModal()} ></i>
            </div>
            {showSubscriptionLoader && 
              <div className="progressor">
                <Stack sx={{ color: 'grey.500' }}>
                  <CircularProgress color="inherit" size={20} />
                </Stack>
              </div>
}
 {             (<>
                {subscriptionArray1.length>0?(
                  subscriptionArray1.map((item)=>(
                  <div className='subscriptions--made' key={item.id}>
                    { (subscriptionClicked===item.id) && (item.status==='pending') && showConfirmSubscriptionTransfer && <SubscriptionTransfer description={item.description} id={item.id} emoji={item.emoji} imageURL={item.imageURL}/>} 
                    
                      {(item.imageURL) && !(item.status==="completed") && <img draggable={false}  onClick={() => OpenSubscriptionConfirmation(item.id)} src={item.imageURL} className="logo--brand"></img>  }
                      {(item.imageURL) && (item.status==="completed") && <i className='bx bx-check' id="checkIt"></i>  }
                      {!(item.imageURL) && (item.status==="completed") && <i className='bx bx-check' id="checkIt"></i>  }
                      {!(item.imageURL) && (item.status==="pending") && <img draggable={false}   onClick={() => OpenSubscriptionConfirmation(item.id)} src={defaultImage} className="logo--brand" style={{backgroundColor:'white',borderRadius:'10px',padding:'3px 3px'}}></img> }


                    <div className='subscription--type--amount--div'>
                      <p className='subscription--type'>{item.description}</p>
                      <p className='capital'>{Math.abs(formatAmount(item.amount).toFixed(2))} {displayCurrency}</p>
                    </div>
                    {(showSubscriptionDeleteLoader===item.id) ? <Stack sx={{ color: 'grey.500',marginRight:"10px" }}>
                      <CircularProgress color="inherit" size={20} />
                    </Stack> : 
                    <>
                      <i class='bx bx-trash' onClick={()=>handleDeleteSubscription(item.id)} id="three-dots" ></i>
                    </>
                    }
                  </div>
                  )
                  ))
                  :
                  <div className="subscriptions--not--found--div">
                    {!showSubscriptionLoader && (<p className="subscriptions--not--found">No Subscriptions Found</p>)}
                  </div>
                }
              {
                <AnimatePresence>
              {showAll && (<motion.div variants={DropDownVariants} initial='hidden' animate='visible' exit='exit'>
                {(subscriptionArray2.length>0 && showAll) ?(
                  subscriptionArray2.map((item)=>(
                  <div className='subscriptions--made' key={item.id}>
                    { (subscriptionClicked===item.id) && (item.status==='pending') && showConfirmSubscriptionTransfer && <SubscriptionTransfer description={item.description} id={item.id} emoji={item.emoji} imageURL={item.imageURL}/>} 
                    
                      {(item.imageURL) && !(item.status==="completed") && <img draggable={false}  onClick={() => OpenSubscriptionConfirmation(item.id)} src={item.imageURL} className="logo--brand"></img>  }
                      {(item.imageURL) && (item.status==="completed") && <i className='bx bx-check' id="checkIt"></i>  }
                      {!(item.imageURL) && (item.status==="completed") && <i className='bx bx-check' id="checkIt"></i>  }
                      {!(item.imageURL) && (item.status==="pending") && <img draggable={false}   onClick={() => OpenSubscriptionConfirmation(item.id)} src={defaultImage} className="logo--brand" style={{backgroundColor:'white',borderRadius:'10px',padding:'3px 3px'}}></img> }


                    <div className='subscription--type--amount--div'>
                      <p className='subscription--type'>{item.description}</p>
                      <p className='capital'>{Math.abs(formatAmount(item.amount).toFixed(2))}  {displayCurrency}</p>
                    </div>
                    {(showSubscriptionDeleteLoader===item.id) ? <Stack sx={{ color: 'grey.500',marginRight:"10px" }}>
                      <CircularProgress color="inherit" size={20} />
                    </Stack> : 
                    <>
                      <i class='bx bx-trash' onClick={()=>handleDeleteSubscription(item.id)} id="three-dots" ></i>
                    </>
                    }
                  </div>
                  )
                  ))
                  :
                  <></>
                }
                
              </motion.div>)}
              </AnimatePresence>
              }
                </>
              )
            }
            {subscriptionArray2.length>0 && <div className="showAll--div--subscriptions">
              <p className="showAll--text" onClick={()=>handleShowAllClick()}>{showAll ? "Collapse" : "Expand"}</p>
            </div>}
          </div>
        </>
    )
}
