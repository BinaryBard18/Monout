import React, { useContext, useEffect, useState } from "react";
import '../Wallets.css';
import AppContext from "../context/AppContext";
import { useParams } from "react-router-dom";
import { collection, onSnapshot, query, where,getDocs, deleteDoc, updateDoc, orderBy,limit, doc, startAfter,addDoc } from "firebase/firestore";
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import { db } from "../Firebase/firebase";
import emojiRegex from "emoji-regex";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

export default function TransactionHistory() {
    const {
        showAddTransactionModal,
        setShowAddTransactionModal,
        setShowExpense,
        setShowIncome,
        setShowTransfer,
        uid,
        setUid
    } = useContext(AppContext);
    

    const [transactionData, setTransactionData] = useState([]);
    const [displayCurrency, setDisplayCurrency] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [transacs,setTransacs] = useState([])
    const [transfers, setTransfers] = useState([]);
    const [walletID,setWalletID] = useState('');
    const [showLoader,setShowLoader] = useState(null);
    const [ID,setID] = useState(null);
    const [isFetchingMore,setIsFetchingMore] = useState(null);

    const [lastDocTransfer,setLastDocTransfer] = useState();
    const [lastDocTransaction,setLastDocTransaction] = useState();

    const [summarize,setSummarize] = useState({
        uid : '',
        id : nanoid(),
        totalIncome : 0,
        totalExpenditure : 0,
        transfersReceived : 0,
        transfersSent : 0,
        duration : '',
        totalSubscriptions : ''
    })

    const { id } = useParams();
    

    useEffect(() => {
        const storedUid = JSON.parse(localStorage.getItem('UID'));
        if (storedUid) {
            setUid(storedUid);
        }

        const storedCurrency = JSON.parse(localStorage.getItem("currencyType"));
        if (storedCurrency) {
            setDisplayCurrency(storedCurrency.label);
        }

        const storedWalletId = JSON.parse(localStorage.getItem('wallet_id'));
        if(storedWalletId){
            setWalletID(storedWalletId)
        }
    }, []);

    useEffect(() => {
        if (uid && id) {
            setTransacs([])
            fetchTransactions(uid, id);
            CheckIfResetDateReached(uid)
            // CreateSummary(uid,"June 29,2024","July 29,2024",id)
        }
    }, [uid, id]);

    useEffect(() => {
        const combinedTransactions = [...transactions, ...transfers];
        const filteredTransactions = combinedTransactions.filter(transaction => {
            return transaction.wallet_id === id || transaction.wallet_id_from === id || transaction.wallet_id_to === id;
        });
        setTransactionData(groupTransactionsByDate(filteredTransactions));
    }, [transactions, transfers, id]);

    async function CheckIfResetDateReached(uid) {
        try {
            const q = query(collection(db, 'users'), where('uid', '==', uid));
            const docSnapshots = await getDocs(q);

            if (!docSnapshots.empty) {
                const doc = docSnapshots.docs[0];
                const item = doc.data();
                const currentDate = dayjs();
                const resetDateStored = dayjs(item.resetDate, 'MMMM DD,YYYY');
                const startDate = item.startDate;
                const resetDate = item.resetDate;
                const startDateObject = dayjs(item.startDate,"MMMM DD,YYYY");
                localStorage.setItem("startDate",startDate);
                // console.log('Current date:', currentDate.format('YYYY-MM-DD'));
                // console.log('Reset date:', resetDateStored.format('YYYY-MM-DD'));

                if (resetDateStored.isBefore(currentDate)) {
                    console.log('Reset date has passed, triggering reset...');
                    await CreateSummary(uid,startDate,resetDate,id);
                    console.log("Summary Created...");
                    await ResetLimits(uid);
                    // Update joinDate and resetDate in the user document
                    const newStartDate = dayjs().format("MMMM DD, YYYY");
                    const newResetDate = dayjs(item.resetDate, 'MMMM DD, YYYY').add(1, 'month').format("MMMM DD, YYYY");

                    await updateDoc(doc.ref, {
                        startDate: newStartDate,
                        resetDate: newResetDate
                    });

                    console.log('Reset date and join date updated successfully.');
                } else {
                    console.log('Reset date has not passed yet.');
                }
            } else {
                console.log('No document found for uid:', uid);
            }
        } catch (error) {
            console.error("Error occurred in CheckIfResetDateReached:", error);
        }
    }   

    async function CreateSummary(uid, startDate, resetDate, id) {
    try {
        console.log("Function Inputs - uid:", uid, "id:", id);

        const q = query(collection(db, 'transactions'), where('uid', '==', uid));
        const docSnapshot = await getDocs(q);
        const resetDateStored = dayjs(resetDate, 'MMMM DD, YYYY');
        const startDateObject = dayjs(startDate, "MMMM DD, YYYY");

        if (!docSnapshot.empty) {
            let totalIncome = 0;
            let totalExpense = 0;
            let receivedTransfers = 0;
            let sentTransfers = 0;
            let subscriptions = 0;
            let fetchedTransactions = [];
            console.clear();
            console.log(resetDateStored);
            console.log(startDateObject);

            for (const doc of docSnapshot.docs) {
                const item = doc.data();
                const date = dayjs(item.date, "MMMM DD, YYYY");

                if ((date.isAfter(startDateObject) || date.isSame(startDateObject)) && date.isBefore(resetDateStored)) {
                    console.log(item);
                    fetchedTransactions.push(item);
                    if (item.typeOfTransaction === 'expense') {
                        totalExpense += parseFloat(item.amount);
                    }
                    if (item.typeOfTransaction === 'income') {
                        totalIncome += parseFloat(item.amount);
                    }
                    if (item.typeOfTransaction === 'transfer') {
                        console.log(item);
                        if (item.wallet_id_from === id) {
                            sentTransfers += parseFloat(item.amount);
                        } else {
                            receivedTransfers += parseFloat(item.amount);
                        }
                    }
                    if (item.typeOfTransaction === 'subscription') {
                        subscriptions += parseFloat(item.amount);
                    }
                    console.clear();
                    console.log("Income:", totalIncome);
                    console.log("Expense:", totalExpense);
                    console.log("Received:", receivedTransfers);
                    console.log("Sent:", sentTransfers);
                    console.log("Subscriptions:", subscriptions);
                }
            }

        const categoryTotals = fetchedTransactions.reduce((acc, transaction) => {
        const categoryWithEmoji = transaction.category || 'Uncategorized';
        const type = transaction.typeOfTransaction;

        // Separate emoji and category name
        const regex = emojiRegex();
        const match = categoryWithEmoji.match(regex);
        let emoji = '';
        let categoryName = categoryWithEmoji;

        if (match) {
            emoji = match[0]; // Assuming the first match group contains the emoji
            categoryName = categoryWithEmoji.replace(regex, '').trim(); // Remove emoji from category name
        }

        // Determine imageURL for subscriptions
        let imageURL = '';
        if (type === 'subscription') {
            // Set imageURL based on subscription logic (example)
            imageURL = transaction.imageURL;
        }

        // Find if there's already an entry for this category and type
        const existingEntryIndex = acc.findIndex(item => item.categoryName === categoryName && item.type === type);

        if (existingEntryIndex !== -1) {
            // Update existing entry's total
            acc[existingEntryIndex].totalAmount += parseFloat(transaction.amount);
        } else {
            // Add new entry with total
            acc.push({
                category: categoryWithEmoji, // Full category name with emoji
                categoryName: categoryName, // Category name without emoji
                emoji: emoji,
                type: type,
                totalAmount: parseFloat(transaction.amount),
                imageURL: imageURL, // Add imageURL field
            });
        }

        return acc;
        }, []);


            const startSplit = startDate.split(' ');
            const startMonth = startSplit[0].substring(0, 3);
            const date1 = startSplit[1].substring(0,2);
            const resetSplit = resetDate.split(' ');
            const resetMonth = resetSplit[0].substring(0, 3);
            const date2 = resetSplit[1].substring(0,2);

            let duration;
            if (resetMonth !== startMonth) {
                duration = `${startMonth} - ${resetMonth}`;
            } else {
                duration = `${startMonth}`;
            }

            const range = `${startMonth} ${date1} - ${resetMonth} ${date2}`;

            const updatedObject = {
                range : range,
                uid : uid,
                id : nanoid(),
                totalIncome: totalIncome,
                totalExpense: totalExpense,
                receivedTransfers: receivedTransfers,
                sentTransfers: sentTransfers,
                subscriptions: subscriptions,
                categoryArray: categoryTotals,
                duration: duration,
                date : dayjs().format("YYYY-MM-DD"),
                savings : parseFloat(totalIncome-totalExpense)
            };

            const monthlyExpendRef = collection(db, 'monthlySummaries');
            await addDoc(monthlyExpendRef, updatedObject);
            console.log(updatedObject);
        }
    } catch (error) {
        console.log("Some Error occurred:", error);
    }
}


    async function ResetLimits(uid) {
        try {
            const q = query(collection(db, 'limitsByCategory'), where('uid', '==', uid));
            const docSnapshots = await getDocs(q);

            if (!docSnapshots.empty) {
                for (const doc of docSnapshots.docs) {
                    const docRef = doc.ref;
                    console.log(doc.data())
                    await updateDoc(docRef, { spent: 0 });
                    console.log(`Document updated: ${doc.id}`);
                }
                console.log("All documents updated successfully.");
            } else {
                console.log('No documents found in limitsByCategory for uid:', uid);
            }
        } catch (error) {
            console.error("Error occurred in ResetLimits:", error);
        }
    }

    async function fetchTransactions(uid, id) {
        try {
            console.log('Fetching transactions for uid:', uid, 'and wallet_id:', id);

            const q = query(
                collection(db, 'transactions'),
                where('uid', '==', uid),
                where('wallet_id', '==', id),
                orderBy('dateOfTransaction', 'desc'),
                limit(10)
            );

            const q2 = query(
                collection(db, 'transactions'),
                where('uid', '==', uid),
                where('typeOfTransaction', '==', 'transfer'),
                orderBy('dateOfTransaction', 'desc'),
                limit(10)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                let regularTransactions = [];
                let arrayTransactions = [];
                if (!snapshot.empty) {
                    snapshot.docs.forEach((doc) => {
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
                            regularTransactions.push({
                                ...item,
                                text: text,
                                emoji: emoji
                            });
                            arrayTransactions.push(item);
                        } else {
                            regularTransactions.push(item);
                            arrayTransactions.push(item);
                        }
                    });
                }
                const lastDoc = snapshot.docs[snapshot.docs.length-1];
                console.log(regularTransactions);
                setLastDocTransaction(lastDoc);
                console.log(lastDoc);
                setTransactions(regularTransactions);
            });

            const unsubscribeTransfers = onSnapshot(q2, (snapshot) => {
                let transferTransactions = [];
                if (!snapshot.empty) {
                    snapshot.docs.forEach((doc) => {
                        const item = doc.data();
                        transferTransactions.push(item);
                    });
                    console.log(transferTransactions);
                    const transferLastDoc = snapshot.docs[snapshot.docs.length-1];
                    setLastDocTransfer(transferLastDoc);
                    console.log(transferLastDoc);
                    setTransfers(transferTransactions);
                }
            });
            return () => {
                unsubscribe();
                unsubscribeTransfers();
            };
        } catch (error) {
            console.error("Error occurred:", error);
        }
    }

    useEffect(() => {
        const combinedTransactions = [...transactions, ...transfers];
        const filteredTransactions = combinedTransactions.filter(transaction => {
            return transaction.wallet_id === id || transaction.wallet_id_from === id || transaction.wallet_id_to === id;
        });
        setTransactionData(groupTransactionsByDate(filteredTransactions));
    }, [transactions, transfers, id]);


    //Pagination  :  

    async function fetchMoreTransactions(uid, id, lastDocTransaction, lastDocTransfer) {
        try {
            if (!uid || !id || !lastDocTransaction || !lastDocTransfer) {
                console.error("One or more parameters are undefined", { uid, id, lastDocTransaction, lastDocTransfer });
                return;
            }
            setIsFetchingMore(true);

            console.log(lastDocTransaction);
            console.log(lastDocTransfer);



            const q = query(
                collection(db, 'transactions'),
                where('uid', '==', uid),
                where('wallet_id', '==', id),
                orderBy('dateOfTransaction', 'desc'),
                startAfter(lastDocTransaction),
                limit(10)
            );

            const q2 = query(
                collection(db, 'transactions'),
                where('uid', '==', uid),
                where('typeOfTransaction', '==', 'transfer'),
                orderBy('dateOfTransaction', 'desc'),
                startAfter(lastDocTransfer),
                limit(10)
            );

            const [transactionSnapshot, transferSnapshot] = await Promise.all([getDocs(q), getDocs(q2)]);

            if (!transactionSnapshot.empty) {
                let moreTransactions = transactionSnapshot.docs.map(doc =>{
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
                            return {
                                ...item,
                                text : text,
                                emoji : emoji
                            }
                        } else {
                            return item
                        }
                });
                setTransactions(prevTransactions => [...prevTransactions, ...moreTransactions]);
                setLastDocTransaction(transactionSnapshot.docs[transactionSnapshot.docs.length - 1]);
            }

            if (!transferSnapshot.empty) {
                let moreTransfers = transferSnapshot.docs.map(doc => doc.data());
                setTransfers(prevTransfers => [...prevTransfers, ...moreTransfers]);
                setLastDocTransfer(transferSnapshot.docs[transferSnapshot.docs.length - 1]);
            }
            setIsFetchingMore(null);
        } catch (error) {
            console.log("Error occurred: ", error);
        }
    }

    function groupTransactionsByDate(transactions) {
        const groupedTransactions = transactions.reduce((acc, transaction) => {
            const date = transaction.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(transaction);
            return acc;
        }, {});

        return Object.keys(groupedTransactions).map((date) => ({
            date: date,
            transactions: groupedTransactions[date]
        })).sort((a, b) => dayjs(b.date).isBefore(dayjs(a.date)) ? -1 : 1);
    }

    const TransferGreenStyles = {
        fontSize: '1.3rem',
        fontFamily: 'Karla, sans-serif',
        fontWeight: '600',
        color: '#60E27F'
    };
    const TransferRedStyles = {
        fontSize: '1.3rem',
        fontFamily: 'Karla, sans-serif',
        fontWeight: '600',
        color: '#cf0e0e'
    };

    function OpenAddTransaction() {
        setShowAddTransactionModal(true);
        setShowExpense(true);
        setShowIncome(false);
        setShowTransfer(false);
    }

    async function updateSpendInLimits(uid, name, amount) {
        try {
            console.log('updateSpendInLimits uid:', uid);
            console.log('updateSpendInLimits name:', name);
    
            const w = query(collection(db, 'limitsByCategory'), where('uid', '==', uid), where('categoryNameChosen', '==', name));
            const allDocs = await getDocs(w);
    
            if (!allDocs.empty) {
                allDocs.forEach(async (doc) => {
                    const item = doc.data();
                    const spend = parseFloat(item.spent);
                    console.log('Current spend:', spend);
                    console.log('Item data:', item);
    
                    const updatedSpend = spend - amount;
                    const docRef = doc.ref;
                    await updateDoc(docRef, { spent: updatedSpend });
                });
            }
        } catch (error) {
            console.log("Error occurred in updateSpendInLimits:", error);
        }
    }

    async function handleChangeInBalance(uid,amount,typeOfTransaction){
        try {
            console.log(walletID);
            const q = query(collection(db,'wallets'),where('uid','==',uid),where('id','==',walletID));
            const allDocs = await getDocs(q);
            if(!allDocs.empty){
                allDocs.forEach(async (doc)=>{
                    const item = doc.data();
                    const balance = parseFloat(item.balance);
                    const newBalance = (typeOfTransaction==="expense" )? balance+amount : balance-amount;
                    const docRef = doc.ref;
                    await updateDoc(docRef,{balance : newBalance});
                })
            }
        } catch (error) {
            console.log("Error occured : ",error);
        }
    }

    async function handleChangeInBalanceOfTransfer(uid,amount,wallet,type){
        try {
            // console.log(walletID);
            const q = query(collection(db,'wallets'),where('uid','==',uid),where('id','==',wallet));
            const allDocs = await getDocs(q);
            if(!allDocs.empty){
                allDocs.forEach(async (doc)=>{
                    const item = doc.data();
                    const balance = parseFloat(item.balance);
                    const newBalance = (type==="from")? balance+amount : balance-amount;
                    const docRef = doc.ref;
                    await updateDoc(docRef,{balance : newBalance});
                    console.log("Updated Sucessfully")
                })
            }
        } catch (error) {
            console.log("Error occured : ",error);
        }
    }

    async function handleTransferBalance(uid,itemID,amount,id){
        const q = query(collection(db,'transactions'),where('uid','==',uid),where('typeOfTransaction','==','transfer'),where('id','==',itemID));
        const docSnapshot = await getDocs(q);
        if(!docSnapshot.empty){
            docSnapshot.forEach(async (doc)=>{
                const item = doc.data();
                console.log(item);
                const fromID = item.wallet_id_from;
                const sender = 'from';
                const receiver = 'to';
                const toID = item.wallet_id_to;
                await handleChangeInBalanceOfTransfer(uid,amount,fromID,sender);
                await handleChangeInBalanceOfTransfer(uid,amount,toID,receiver);
                
            })
        }
    }

    async function handleDeleteTransaction(itemID) {
        try {
            setShowLoader(true); 
            setID(itemID); 
    
            const q = query(collection(db, 'transactions'), where('uid', '==', uid), where('id', '==', itemID));
            const docSnapshot = await getDocs(q);
    
            if (!docSnapshot.empty) {
                const item = docSnapshot.docs[0];
                const element = docSnapshot.docs[0].data();
                console.log(element);
                const name = element.category;
                console.log(name)
                const amount = parseFloat(element.amount);
                console.log(amount);
                const typeOfTransaction = element.typeOfTransaction;
                await updateSpendInLimits(uid,name,amount);
                if(element.typeOfTransaction==='transfer'){
                    await handleTransferBalance(uid,itemID,amount);
                }else{
                    await handleChangeInBalance(uid,amount,typeOfTransaction)
                }
                await deleteDoc(item.ref);
                setShowLoader(false);
                setID(null); 
            }
        } catch (error) {
            console.log("Error occurred: ", error);
            setShowLoader(false);
            setID(null); 
        }
    }

    return (
        <>
            <div className='child--div--one'>
                <div className='wallet-type-history-analytics-settings'>
                </div>
                <div className='transaction--addbutton--div'>
                    <p className='transaction'>Transactions</p>
                    <button type="button" className='addbutton' onClick={OpenAddTransaction}>Add Transaction</button>
                </div>

                <div className='allTransactions'>
                    {transactionData.length > 0 ? (
                        transactionData.map((item) => (
                            <React.Fragment key={item.date}>
                                <p className='date'>{item.date}</p>
                                {item.transactions.map((element) => (
                                    <div className='allTransactions--child' key={element.id}>
                                        <div className='transactions--made'>
                                            {element.emoji && <p className="emoji--icon">{element.emoji}</p>}
                                            {element.imageURL && <img src={element.imageURL} alt='joystick' className='pizza' draggable={false} />}
                                            <div className='amount--name1'>
                                            {element.typeOfTransaction === 'transfer' ? (
                                                    <p className='amount' style={element.wallet_id_to === id ? TransferGreenStyles : TransferRedStyles}>
                                                        {element.wallet_id_to === id ? '+' : '-'} {Number(element.amount).toFixed(2)} {displayCurrency}
                                                    </p>
                                                ) : (
                                                    <p className='amount'>
                                                        {Number(element.amount).toFixed(2)} {displayCurrency}
                                                    </p>
                                                )}
                                                <p className='name1'>{element.description}</p>
                                            </div>
                                            {element.id===ID ?
                                            <div className="load">
                                                {<Stack sx={{ color: 'grey.500' }}>
                                                    <CircularProgress color="inherit" size={20} />
                                                </Stack>}   
                                            </div>
                                            : 
                                            <i className='bx bx-trash move--to--bin' id="three-dots"onClick={()=>handleDeleteTransaction(element.id)}></i>}
                                        </div>
                                    </div>
                                ))}
                            </React.Fragment>
                        ))
                    ) : <div className="nothingFound--div">
                           <p className="nothingFound--text">No Transaction yet..</p> 
                        </div>}
                </div>
                {(transactions.length+transfers.length)>10  && <div className="loadMore--button--div">
                    <button className={!isFetchingMore ? "load--more" : "loading"} disabled={isFetchingMore} onClick={()=>fetchMoreTransactions(uid, walletID, lastDocTransaction, lastDocTransfer)}>
                        {!isFetchingMore ?  'Load more' : 'Loading..'}
                    </button>
                </div>} 
            </div>
        </>
    );
}

