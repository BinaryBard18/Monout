import React, { useContext, useEffect } from 'react'
import "../LimitByCategoryModal.css"
import "../AddSubscriptionModal.css"
import "../AddTransaction.css"
import '../ReportBug.css';
import { motion } from 'framer-motion';
import { ModalVariant } from './LimitByCategoryModal';
import AppContext from '../context/AppContext';
import Expense from './Expense';
import Income from "./Income";
import TransferAmount from "./TransferAmount";


export default function AddTransaction() {

    const {
            showAddTransactionModal,
            setShowAddTransactionModal, 
            showIncome,
            setShowIncome,
            showExpense,
            setShowExpense,
            showTransfer,
            setShowTransfer} = useContext(AppContext);

    const BackgroundStyles={
        backgroundColor:'#252626',
        color:'white'
    }

    function CloseSubscriptionModal(){
        setShowAddTransactionModal(false);
    }    

    function OpenIncome(){
        setShowExpense(false);
        setShowIncome(true);
        setShowTransfer(false);
    }
    function OpenExpense(){
        setShowExpense(true);
        setShowIncome(false);
        setShowTransfer(false);
    }
    function OpenTransfer(){
        setShowExpense(false);
        setShowIncome(false);
        setShowTransfer(true);
    }



    return(

        <div className='addTransaction--parent--div'>

                <motion.div variants={ModalVariant} initial='hidden' animate='visible' className='limit--by--category--child--div'>
                    <div className='limit--by--category--title--cross'>
                        <p className='limit--by--category--title'>Add Transaction</p>
                        <i class='bx bx-x' id="cross1" onClick={()=>CloseSubscriptionModal()}></i>
                    </div>
                    <div className='underlined'>

                    </div>
                    
                    <div className='expense--income--transfer'>
                        <div className='expense--title' style={showExpense?BackgroundStyles:null} onClick={()=>OpenExpense()}>Expense</div>
                        <div className='income--title' style={showIncome?BackgroundStyles:null} onClick={()=>OpenIncome()}>Income</div>
                        <div className='transfer--title' style={showTransfer?BackgroundStyles:null} onClick={()=>OpenTransfer()}>Transfer</div>
                    </div>
                    {showExpense && <Expense/>}
                    {showTransfer && <TransferAmount/>}
                    {showIncome && <Income/>}
                    
                </motion.div>
        </div>
    )
}
