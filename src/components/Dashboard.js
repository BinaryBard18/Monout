import React, { useContext, useState, useEffect } from "react";
import "../Dashboard.css";
import "../Categories.css"
import AppContext from "../context/AppContext";
import { collection, onSnapshot,orderBy, query,where,getDocs, updateDoc, writeBatch} from "firebase/firestore";
import { db } from "../Firebase/firebase";
import Stack from '@mui/material/Stack';
import emojiRegex from "emoji-regex";
import CircularProgress from '@mui/material/CircularProgress';
import defaultImage from "../other.png"
import { AnimatePresence, motion } from "framer-motion";
import dayjs from "dayjs";
import { BarChart } from '@mui/x-charts';
import { PieChart } from '@mui/x-charts/PieChart';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import emojiRegex from "emoji-regex";

export default function DashBoard() {
  const { showAddWallet, setShowAddWallet, uid, setUid,greet } = useContext(AppContext);
  const [displayCurrency, setDisplayCurrency] = useState('');
  const [arrayWallets, setArrayWallets] = useState([]);
  const [isLoading,setIsLoading] = useState(false);
  const [isEmpty,setIsEmpty] = useState(false);
  const [showSubscriptionLoader,setShowSubscriptionLoader] = useState(true);//made true so that nothing found pehle nai dikhe
  const [subscriptionArray1,setSubscriptionArray1] = useState([]);
  const [subscriptionArray2,setSubscriptionArray2] = useState([]);
  const [transactionsArray,setTransactionsArray] = useState([]);
  const [showAll,setShowAll] = useState(false);
  const [firstName,setFirstName] = useState(null);
  const [itemData,setItemData] = useState(null);
  const [transactionArray,setTransactionArray] = useState([]);
  const [subscriptionAmount,setSubscriptionAmount] = useState(0);
  const [incomeAmount,setIncomeAmount] = useState(0);
  const [expenseAmount,setExpenseAmount] = useState(0);

  const [data,setData] = useState([]);


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

  const colorPalette = [
    "#1E90FF", // Dodger Blue
    "#FF6347", // Tomato
    "#20B2AA", // Light Sea Green
    "#FFD700", // Gold
    "#9370DB", // Medium Purple
    "#32CD32",  // Lime Green
    "#FF8C00", // Dark Orange
    "#4682B4", // Steel Blue
    "#8FBC8F", // Dark Sea Green
    "#FF1493", // Deep Pink
    "#9932CC", // Dark Orchid
    "#556B2F",  // Dark Olive Green
    "#FF6347", // Tomato
    "#00CED1", // Dark Turquoise
    "#696969", // Dim Gray
    "#FFD700", // Gold
    "#DA70D6", // Orchid
    "#2F4F4F"  // Dark Slate Gray
  ];

  const valueFormatter = (value) => `${value} ${displayCurrency}`;

useEffect(()=>{
  const name = JSON.parse(localStorage.getItem("userName"));  
  if(name){
    const firstName = name.split(' ')[0];
    setFirstName(firstName);
  }
},[])

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


  useEffect(() => {
    const storedUid = JSON.parse(localStorage.getItem('UID'));
    const storedCurrency = JSON.parse(localStorage.getItem('currencyType'));
    
    if(storedCurrency){
      setDisplayCurrency(storedCurrency.label);
    }

    if (storedUid) {
      setUid(storedUid);
    }
  }, []);

  useEffect(() => {
    fetchWallet(uid);
    fetchSubscriptionDetails(uid);
    fetchRecentTransactions(uid);
    TotalAmount(uid);
    fetchTransactionForCalculation(uid);
    CheckIfResetDateReached(uid);
    // fetchDefaultCategoriesDetails(uid);
    Savings(uid);
    // CheckIfResetDateReached(uid);
  }, [uid]);
  



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
            console.log(array1 , "array 1")
            console.log(array2 , "array 2")
            setSubscriptionArray1(array1);
            setSubscriptionArray2(newArray);
            setShowSubscriptionLoader(null);
          }else{
            setSubscriptionArray1(allSubscriptions);
            setSubscriptionArray2([]);
            setShowSubscriptionLoader(null);
          }
        }else{
          setShowSubscriptionLoader(null);
        }
        return ()=>unsubscribe();
      })
    } catch (error) {
      console.log("Error occured : ",error);
      setShowSubscriptionLoader(null);
    }
  }

  async function fetchRecentTransactions(uid){
    try {
      const q = query(collection(db,'transactions'),where('uid','==',uid),where('typeOfTransaction','!=','transfer'));
      const unsubscribe = onSnapshot(q,(snapshot)=>{
        let transaction = []
        if(!snapshot.empty){
          snapshot.docs.forEach((doc)=>{
            const item = doc.data();
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
                text : text,
                emoji : emoji
              }
              transaction.push(object);
          }
          })
          const newArray = transaction.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
          const shortArray = newArray.slice(0,4);
          console.log(shortArray);
          setTransactionsArray(shortArray)
        }
      })
      return unsubscribe;
    } catch (error) {
      console.log("Error occured : ",error);
    }
  }

  async function fetchWallet(uid){
    try {
        setIsLoading(true);
        const q = query(collection(db, "wallets"),where('uid','==',uid),orderBy('balance'));
          const unsubscribe = onSnapshot(q,(snapshot) => {
            const walletsData = snapshot.docs
              .map(doc => doc.data())
            setArrayWallets(walletsData);
                setIsEmpty(walletsData.length===0);
            setIsLoading(false);
          });
          // Cleanup the subscription on unmount
          return () => unsubscribe();
    } catch (error) {
        console.log("Some error : ",error);
        setIsLoading(false);
    }
  }

  function OpenAddWallet() {
    setShowAddWallet(true);
  }

  function handleShowAllClick(){
    setShowAll(prev=>!prev)
  }

  async function fetchTheLimits(uid, name) {
    try {
      const q = query(collection(db, 'limitsByCategory'), where('uid', '==', uid), where('categoryNameChosen', '==', name));
      const allDocs = await getDocs(q);
      let limits = {};
      if (!allDocs.empty) {
        allDocs.forEach((doc) => {
          const element = doc.data();
          limits = { ...limits, ...element }; // Spread each limit's fields into the limits object
        });
      }
      return limits;
    } catch (error) {
      console.log("Error occurred: ", error);
      return {};
    }
  }

  async function Savings(uid){
    try {
      const q = query(collection(db,'monthlySummaries'),where('uid','==',uid));
      const docSnapshot = await getDocs(q);
      const array = [];
      if(!docSnapshot.empty){
        docSnapshot.forEach((doc)=>{
          const item = doc.data();
          array.push(item);
        })
        array.sort((a, b) => {
          const dateA = dayjs(a.date, "MMMM DD,YYYY");
          const dateB = dayjs(b.date, "MMMM DD,YYYY");
          
          return dateA.diff(dateB);
        });
        console.log("Final monthlySummaries array:", array);
        setData(array);
      }
    } catch (error) {
      console.log("Error occured : ",error);
    }
  }

  async function TotalAmount(uid){
    try {
      const q = query(collection(db,'transactions'),where('uid','==',uid));
      const unsubscribe = onSnapshot(q,(snapshot)=>{
        let totalSubscriptionMoney = 0;
        let totalIncomeMoney = 0;
        let totalExpenseMoney = 0;
        if(!snapshot.empty){
          snapshot.docs.forEach((doc)=>{
            const item = doc.data();
            if(item.typeOfTransaction==='subscription'){
              const amount = parseFloat(item.amount)
              totalSubscriptionMoney+=amount;
            }
            
            if(item.typeOfTransaction==='income'){
              const amount = parseFloat(item.amount)
              totalIncomeMoney+=amount;
            }

            if(item.typeOfTransaction==='expense'){
              const amount = parseFloat(item.amount)
              totalExpenseMoney+=amount;
            }
          })
          setSubscriptionAmount(totalSubscriptionMoney);
          setIncomeAmount(totalIncomeMoney);
          setExpenseAmount(totalExpenseMoney);
        }
      })
      return unsubscribe;
    } catch (error) {
      console.log(error)
    }
  }

  async function CheckIfResetDateReached(uid) {
    try {
        const q = query(collection(db, 'users'), where('uid', '==', uid));
        const docSnapshots = await getDocs(q);

        if (!docSnapshots.empty) {
            const doc = docSnapshots.docs[0];
            const item = doc.data();
            const startDate = item.startDate;
            localStorage.setItem("startDate",startDate);
        }
    } catch (error) {
        console.error("Error occurred in CheckIfResetDateReached:", error);
    }
}   

  // function handleBarItemClicked(event, d){
  //   setItemData(d);
  //   console.log(d);
  //   const index = d.dataIndex;
  //   console.log(dataset[index])
  // }

  async function fetchTransactionForCalculation(uid) {
    try {
        const q = query(collection(db, 'transactions'), where('uid', '==', uid), where('typeOfTransaction', 'not-in', ['transfer','subscription']));
        const unsubscribe = onSnapshot(q,(snapshot)=>{
        let transactionData = [];
          if(!snapshot.empty){
            snapshot.docs.forEach((doc)=>{
              const item = doc.data();
              const date = item.date;
              const dayjsObject = dayjs(date, 'MMMM DD, YYYY');
              const storedDate = localStorage.getItem('startDate');
              const storedDateObject = dayjs(storedDate, 'MMMM DD, YYYY');

              if(dayjsObject.isAfter(storedDateObject)||dayjsObject.isSame(storedDateObject)){
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
                    transactionData.push(object);
                  }
                console.log(item);
              }
            })
            const groupedData = transactionData.reduce((acc, curr) => {
              const { text, amount } = curr;
              const amountNumber = parseFloat(amount);
              const existing = acc.find((item) => item.label === text);
              if (existing) {
                  existing.value += amountNumber;
              } else {
                  acc.push({
                      label: text,
                      value: amountNumber,
                      color: colorPalette[acc.length % colorPalette.length]
                  });
              }
              return acc;
            }, []);

            const dataLen = groupedData.length;
                    const topData = groupedData.slice(0, 7);
                    const otherData = groupedData.slice(7);
                    const otherValue = otherData.reduce((acc, item) => acc + item.value, 0);
                    if (otherData.length > 0) {
                      const displayData = [
                        ...topData,
                        { value: otherValue, label: 'Others', color: '#7F8C8D' },
                      ];
                      setTransactionArray(displayData);
                    } else {
                      const displayData = topData;
                      setTransactionArray(displayData);
                    }
          }
        })
    } catch (error) {
        console.error("Error occurred:", error);
    }
}


  return (
    <div className="parent--dashboard--page">
      <div className="child--div--dashboard">
        <div className="dashboard--addWallet">
          <p className="dashboard--title">Dashboard</p>
          <button type="button" className="addWallet" onClick={() => OpenAddWallet()}>Add Wallet</button>
        </div>
        <div className="greeting--div">
            <p className="greeting">{greet ? `Hey, ${firstName} 👋` : `Welcome Back, ${firstName} 👋`}</p>
        </div>
        <div className="CashBankTracker">
          {isLoading ?
          <div className="no--wallets--div">
              <Stack sx={{ color: 'grey.500' }}>
                  <CircularProgress color="inherit" size={25}/>
              </Stack>
          </div> : 
          <>
              {arrayWallets.length > 0 ? (
                  arrayWallets.map((item) => (
                          <div className="link--router">
                            <div className="cash">
                                <p className="cash--title">{item.name}</p>
                                <p className="amount link--amount">{formatNumberToKMB(item.balance)} {displayCurrency}</p>                              
                            </div>
                        </div>
                  ))
                  ) : (
                      <div className="no--wallets--div">
                          <p className="no--wallets">Your Wallets will be displayed here</p>
                      </div>
              )}
          </>
        }
        </div>
        <div className="bar--chart--1">

        </div>
        {/* <ResponsiveContainer width="50%" height="50%">
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="pv" stackId="a" fill="#8884d8" />
          <Bar dataKey="uv" stackId="a" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer> */}
        <div className="charts">
          <div className="pie--div">
            <div className='pie--title--div'>
              <p className='pie--title'>Category-wise Expenditure <span>(in {displayCurrency})</span></p>
            </div>
              {transactionArray && <PieChart
                  className="pie--chart"
                  series={[
                      {
                          innerRadius: 80,
                          outerRadius: 120,
                          paddingAngle: 2,
                          cornerRadius: 3,
                          startAngle: -180,
                          endAngle: 180,
                          cx: 120,
                          cy: 150,
                          data: transactionArray.map((item) => ({ ...item, name: item.label })),
                          animation: true,
                          animationDuration: 800,
                          animationEasing: 'easeOutBounce',
                          root: {
                              fontSize: '1rem',
                          }
                      }
                  ]}
                  labelStyle={{
                      fill: 'white',
                      fontSize: '1rem',
                      color: 'white'
                  }}
              />}
          </div>
          <div className="bar--chart--2">
          <div className="savings--trend--div">
              <p className="savings--trend--div--para">Savings Trend</p>
          </div>
            <BarChart
                dataset={data}
                margin={{ top: 45, bottom: 30, left: 40, right: 30 }}
                xAxis={[{ scaleType: 'band', dataKey:'range'}]}
                series={[
                  { dataKey: 'savings', label: 'Savings', valueFormatter },
                ]}
                width={600}
                height={350}
                options={{
                  yAxis: {
                    tickSize: 0,
                    axisLineStyle: {
                      stroke: 'white',
                    },
                  },
                }}
              />
          </div>
        </div>

        <div className="last--total--subscription">
          <div className="last--transactions">
            <p className="last--transactions--title">Last Transactions</p>
            
            {transactionsArray.length>0 ? (
              transactionsArray.map((item)=>(
                <div className="transfer--icon--info">
                <p className="pizza10">{item.emoji}</p>
                  <div className="info">
                    <p className="amt">{Number(item.amount).toFixed(2)} {displayCurrency}</p>
                    <p className="type">{item.text}</p>
                  </div>
                  {/* <i className='bx bx-dots-vertical-rounded' id="three-dots"></i> */}
                </div>)
              ))
            :
            <div className="recent--transaction--div"><p>No recent Transactions</p></div>  
          }
          </div>
          <div className="total--money">
            <p className="total--money--title">Total money spent till date : </p>
            <div className="amount--currency">
              <p className="typeOfTransactionAmount">Income</p>
              <div className="amount--currency--1">
                <p className="amount">{Math.abs(incomeAmount.toFixed(2))}</p>
                <p className="currency">{displayCurrency}</p>
              </div>
            </div>
            <div className="amount--currency">
              <p className="typeOfTransactionAmount">Expense</p>
              <div className="amount--currency--1">
                <p className="amount">{Math.abs(expenseAmount.toFixed(2))}</p>
                <p className="currency">{displayCurrency}</p>
              </div>
            </div>
            <div className="amount--currency">
              <p className="typeOfTransactionAmount">Subscriptions</p>
              <div className="amount--currency--1">
                <p className="amount">{Math.abs(subscriptionAmount.toFixed(2))}</p>
                <p className="currency">{displayCurrency}</p>
              </div>
            </div>
          </div>
          <div className="all--subscriptions">
            <p className="all-subscriptions--title">All Subscriptions</p>
            <div className="all--subscriptions--info--div">
              {showSubscriptionLoader ? 
                <div className="progressor">
                  <Stack sx={{ color: 'grey.500' }}>
                    <CircularProgress color="inherit" size={20} />
                  </Stack>
                </div>
                : 
                <>
                  {subscriptionArray1.length > 0 ? (
                    subscriptionArray1.map((item) => (
                      <div className="subscription--child--div" key={item.id}>
                        {(item.imageURL) && !(item.status === "completed") && <img draggable={false} src={item.imageURL} className="logo--brand"></img>}
                        {(item.imageURL) && (item.status === "completed") && <i className='bx bx-check' id="checkIt"></i>}
                        {!(item.imageURL) && (item.status === "completed") && <i className='bx bx-check' id="checkIt"></i>}
                        {!(item.imageURL) && (item.status === "pending") && <img draggable={false} src={defaultImage} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '3px 3px' }} className="logo--brand"></img>}
                        <p className="regarding">{item.description}</p>
                        <p className="cost">{Math.abs(Number(item.amount).toFixed(2))} {displayCurrency}</p>
                      </div>
                    ))
                  ) : (
                    <div className="subscriptions--not--found--div">
                      <p className="subscriptions--not--found">No Subscriptions Found</p>
                    </div>
                  )}
                  <AnimatePresence>
                    {showAll && (
                      <motion.div variants={DropDownVariants} initial='hidden' animate='visible' exit='exit'>
                        {subscriptionArray2.length > 0 ? (
                          subscriptionArray2.map((item) => (
                            <div className='subscriptions--made' key={item.id}>
                              {(item.imageURL) && !(item.status === "completed") && <img draggable={false} src={item.imageURL} className="logo--brand"></img>}
                              {(item.imageURL) && (item.status === "completed") && <i className='bx bx-check' id="checkIt"></i>}
                              {!(item.imageURL) && (item.status === "completed") && <i className='bx bx-check' id="checkIt"></i>}
                              {!(item.imageURL) && (item.status === "pending") && <img draggable={false} src={defaultImage} className="logo--brand" style={{ backgroundColor: 'white', borderRadius: '10px', padding: '3px 3px' }}></img>}
                              <div className='subscription--type--amount--div dashboard--subscription--type--div'>
                                <p className='subscription--type'>{item.description}</p>
                                <p className='capital'>{Number(item.amount).toFixed(2)} {displayCurrency}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <></>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              }
              {subscriptionArray2.length > 0 && (
                <div className="showAll--div--subscriptions">
                  <p className="showAll--text" onClick={handleShowAllClick}>
                    {showAll ? "Show Less" : "Show More"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
