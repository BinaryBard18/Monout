import React,{ useContext,useState,useEffect } from "react";
import "../Analysis.css"
import '../Wallets.css';
import pizza from "../pizza.png"
import dayjs from "dayjs";
import joystick from "../joystick.png"
import {motion} from "framer-motion"
import { AnimatePresence } from "framer-motion";
import AppContext from "../context/AppContext";
import { BarChart } from '@mui/x-charts';
import { collection, getDocs, query, where ,onSnapshot,orderBy } from "firebase/firestore";
import { db } from "../Firebase/firebase";

export default function Analysis(){

    const {uid,setUid} = useContext(AppContext);
    const [monthlySummaries,setMonthlySummaries] = useState([]);
    const [id,setId] = useState(null);

    const [displayCurrency,setDisplayCurrency] = useState('');

      useEffect(() => {
        const storedUid = JSON.parse(localStorage.getItem('UID'));
        if (storedUid) {
            setUid(storedUid);
        }

        const storedCurrency = JSON.parse(localStorage.getItem("currencyType"));
        if (storedCurrency) {
            setDisplayCurrency(storedCurrency.label);
        }
    }, []);

    useEffect(()=>{
        setMonthlySummaries([])
        fetchMonthlySummaries(uid);
    },[uid])

    function handleDetailsClick(){
        setShowDetails(prev=>!prev);
    }

    const transitionVariants = {
        hidden:{
            height:0,
            opacity:0
        },
        visible:{
            height:'60%',
            opacity:1,
            transition: {
                duration: 0.4
            }
        },
    }
    // const dataset = [
    //     { london: 59, paris: 57, month: 'Jan-Feb'},
    //     { london: 50, paris: 52, month: 'Feb-Mar' },
    //     { london: 47, paris: 53, month: 'Mar-Apr' },
    //     { london: 54, paris: 56, month: 'Apr' },
    //     { london: 57, paris: 69, month: 'May' },
    //     { london: 60, paris: 63, month: 'Jun' },
    //     { london: 59, paris: 60, month: 'Jul' },
    //     { london: 65, paris: 60, month: 'Aug' },
    //     { london: 51, paris: 51, month: 'Sep' },
    //     { london: 60, paris: 65, month: 'Oct' },
    //     { london: 67, paris: 64, month: 'Nov' },
    //     { london: 61, paris: 70, month: 'Dec' }
    // ];

    async function fetchMonthlySummaries(uid) {
        try {
            console.log("uid:", uid);
            const q = query(collection(db, 'monthlySummaries'), where('uid', '==', uid));
            const querySnapshot = await getDocs(q);
            let array = [];
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const item = doc.data();
                    console.log("Fetched Item:", item); // Log each fetched item
                    array.push(item);
                });
                array.sort((a, b) => {
                    const dateA = dayjs(a.date, "MMMM DD,YYYY");
                    const dateB = dayjs(b.date, "MMMM DD,YYYY");
                    
                    return dateA.diff(dateB);
                });
                setMonthlySummaries(array);
                const length = array.length;
                const lastId = array[length-1].id;
                setId(lastId)
                console.log("Final monthlySummaries array:", array); // Log the final array
            } else {
                console.log("No documents found for uid:", uid);
            }
        } catch (error) {
            console.log("Error occurred:", error);
        }
    }

    function handleBarItemClicked(event, d){
        // setItemData(d);
        console.log(d);
        const index = d.dataIndex;
        console.log(monthlySummaries[index].id);
        setId(monthlySummaries[index].id);
    }

    const {showDetails,setShowDetails} = useContext(AppContext)
    const valueFormatter = (value) => `${value} ${displayCurrency}`;


    return (
        <>
            <div className="pie--bar--chart">
                <div className="bar--chart--analysis--div">
                    <div className="bar--chart--title--div">
                        <p className="bar--chart--title">Analysis of Monthly Spend in Default Categories </p>
                    </div>
                    {monthlySummaries.length > 0 && (
                        <BarChart
                            onItemClick={handleBarItemClicked}
                            margin={{ right: 10 }}
                            dataset={monthlySummaries}
                            xAxis={[{ scaleType: 'band', dataKey: 'range' }]}
                            series={[
                                { dataKey: 'totalIncome', label: 'Income', valueFormatter, color: '#5DC863' },
                                { dataKey: 'totalExpense', label: 'Expenditure', valueFormatter, color: '#f6e01cd1' },
                            ]}
                            width={730}
                            height={400}
                            options={{
                                yAxis: {
                                    tickSize: 0,
                                    axisLineStyle: {
                                        stroke: 'white',
                                    },
                                },
                            }}
                        />
                    )}
                </div>
                
            </div>
            {
  monthlySummaries.length > 0 ? (
    monthlySummaries.map((item, index) => (
      (item.id===id) && (
        <div key={index} className="analysis--parent--div">
          <div className="from--to--earnings--expense">
            <p className="from--to">{item.range}</p>
            <div className="earnings--expense">
              <div className="total--earnings--price">
                <p className="total--earnings">Total Income</p>
                <p className="price">{item.totalIncome} {displayCurrency}</p>
              </div>
              <div className="total--expense--price">
                <p className="total--earnings">Total Expense</p>
                <p className="price">{item.totalExpense} {displayCurrency}</p>
              </div>
            </div>
          </div>
          <AnimatePresence>
                {showDetails && (
                <motion.div variants={transitionVariants} initial="hidden" animate="visible">
                    <div className="horizontal--rule"></div>
                    <div className="category--percentage--spent">
                    <div className="headers">
                        <div className="category--name--div">
                        <p className="category--title">Category</p>
                        </div>
                        <div className="percentage--spent--div">
                        <p className="percentage--title">Percentage</p>
                        <p className="spent--title">Spent</p>
                        </div>
                    </div>
                    {item.categoryArray.length > 0 ? (
                        item.categoryArray.map((element, idx) => (
                        <div key={idx} className="row--div">
                            <div className="row">
                            <div className="category--div">
                                <p className="icon--pizza">{element.category !== 'Uncategorized' ? element.emoji : ''}</p>
                                <p className="icon--pizza">{element.category !== 'Uncategorized' ? element.categoryName : ''}</p>
                            </div>
                            <div className="percentage--spent--data">
                                <p className="icon--pizza">
                                {element.category !== 'Uncategorized'
                                    ? (element.type !== "income"
                                    ? `${((element.totalAmount / item.totalExpense) * 100).toFixed(2)}%`
                                    : `${((element.totalAmount / item.totalIncome) * 100).toFixed(2)}%`)
                                    : ''}
                                </p>
                                <p className="icon--pizza">{element.category !== 'Uncategorized' ? `${element.totalAmount} ${displayCurrency}` : ''}</p>
                            </div>
                            </div>
                        </div>
                        ))
                    ) : null}
                    </div>
                    <div className="transfers--received--sent">
                    <div className="transfers--received">
                        <p className="transfer--received--title">Transfers Received</p>
                        <p className="transfer--received--amt">0 {displayCurrency}</p>
                    </div>
                    <div className="transfers--sent">
                        <p className="transfer--received--title">Transfers Sent</p>
                        <p className="transfer--received--amt">40 {displayCurrency}</p>
                    </div>
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
            <button 
                onClick={handleDetailsClick} 
                type="button" 
                className="less--details"
            >
                {showDetails ? "Less details" : "More details"}
                {showDetails ? <i className='bx bx-chevron-up' id="up--icon"></i> : <i className='bx bx-chevron-down' id="up--icon"></i>}
            </button>
            </div>
        )
        ))
    ) : <></>
    } 
        </>
    );

}