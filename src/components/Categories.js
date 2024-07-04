import React, { useContext,useEffect,useState} from 'react';
import '../Categories.css';
import "../Analysis.css"
import '../Wallets.css';
import { PieChart } from '@mui/x-charts/PieChart';
import {motion} from "framer-motion"
import { BarChart } from '@mui/x-charts';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import AppContext from "../context/AppContext"
import { collection , deleteDoc, getDocs, onSnapshot, orderBy, query, where,doc, updateDoc, getDoc} from 'firebase/firestore';
import { db } from '../Firebase/firebase';
import { Snackbar, Alert,Slide } from '@mui/material';
import { styled } from '@mui/system';
import emojiRegex from 'emoji-regex';

export default function Categories() {

  const {showAddCategoryModal,setShowAddCategoryModal,uid,setUid} = useContext(AppContext);


  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  const [snackbarInfoOpen, setSnackbarInfoOpen] = useState(false);
  const [snackbarInfoMessage, setSnackbarInfoMessage] = useState('');
  const [snackbarInfoSeverity, setSnackbarInfoSeverity] = useState('info');

  const [categoryArray,setCategoryArray] = useState([]);
  const [loader,setLoader] = useState(false);
  const [empty,setEmpty] = useState(false);
  const [originalCategoryArray,setOriginalCategoryArray] = useState([]);
  const [noResults,setNoResults] = useState(false);
  const [showDeleteLoader,setShowDeleteLoader] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [newCategoryName,setNewCategoryName] = useState('');
  const [updateLoader,setUpdateLoader] = useState(false);
  const [del,setDel] = useState(null);
  const [transactionArray,setTransactionArray] = useState([]);
  
  const [displayCurrency,setDisplayCurrency] = useState('')
  
  //Snackbar : 

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
        return;
    }
    setSnackbarOpen(false);
  };

  const handleSnackbarInfoClose = (event, reason) => {
    if (reason === 'clickaway') {
        return;
    }
    setSnackbarInfoOpen(false);
  };


  const showSnackbar = (message, severity = 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  const showInfoSnackbar = (message, severity = 'info') => {
    setSnackbarInfoMessage(message);
    setSnackbarInfoSeverity(severity);
    setSnackbarInfoOpen(true);
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
  const StyledInfoAlert = styled(Alert)(({ theme }) => ({
      width: '100%',
      backgroundColor: '#4666e3',
      color: 'whitesmoke',
  }));

  // useEffect(()=>{
  //   checkAndUpdateName(uid);
  // },[uid])


  const SlideTransition = (props) => {
      return <Slide {...props} direction="left" />;
  };

  useEffect(()=>{
    if(!uid) return;
    FetchCategoryDetails(uid);
    // fetchTransactionForCalculation(uid)
  },[uid]);

  function OpenAddCategoryModal(){
    setShowAddCategoryModal(true);
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
//   const colorPalette = [
    // "#FF8C00", // Dark Orange
    // "#4682B4", // Steel Blue
    // "#8FBC8F", // Dark Sea Green
    // "#FF1493", // Deep Pink
    // "#9932CC", // Dark Orchid
    // "#556B2F"  // Dark Olive Green
// ];
//   const colorPalette = [
//     "#FF6347", // Tomato
//     "#00CED1", // Dark Turquoise
//     "#696969", // Dim Gray
//     "#FFD700", // Gold
//     "#DA70D6", // Orchid
//     "#2F4F4F"  // Dark Slate Gray
// ];

  // const data = [
  //   { value: 70, label: 'Food', color: colorPalette[0] },
  //   { value: 80, label: 'Entertainment', color: colorPalette[1] },
  //   { value: 50, label: 'Utilities', color: colorPalette[2] },
  //   { value: 60, label: 'Rent', color: colorPalette[3] },
  //   { value: 20, label: 'Savings', color: colorPalette[4] },
  //   { value: 40, label: 'Miscellaneous', color: colorPalette[5] },
  //   { value: 30, label: 'Travel', color: colorPalette[6] },
  //   { value: 50, label: 'Education', color: colorPalette[7] },
  //   { value: 70, label: 'Healthcare', color: colorPalette[8] },
  //   { value: 80, label: 'Insurance', color: colorPalette[9] },
  // ];

  // const dataLen = data.length;
  // //Dividing the Data into two arrays topData and OtherData
  // const topData = data.slice(0, 6);
  // //topData contains the first 6 objects of data array
  // const otherData = data.slice(dataLen-1);
  // //OtherData contains the rest of the objects of data array
  // const otherValue = otherData.reduce((acc, item) => acc + item.value, 0);

  // const displayData = [
  //   ...topData,
  //   { value: otherValue, label: 'Others', color: '#7F8C8D' },
  // ];

  const analyticalData = [
    {income : 700,spend : 200, month:'Jan-Mar' },
    {income : 510,spend : 1020, month:'Apr-Jun' },
    {income : 1000,spend : 800, month:'Jul-Sep' },
    {income : 400,spend : 710, month:'Oct-Dec' },
  ]


  async function FetchCategoryDetails(uid) {
    try {
      setLoader(true);
      const q = query(
        collection(db, 'categories'),
        where('uid', '==', uid),
        orderBy('categoryName')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const categoriesData = snapshot.docs.map((doc) => doc.data());
        setCategoryArray(categoriesData);
        setOriginalCategoryArray(categoriesData);
        setEmpty(categoriesData.length === 0);
        setLoader(false);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoader(false);
    }
  }

  // async function checkAndUpdateName(uid){
  //   try {
  //     const q = query(collection(db,"limitsByCategory"),where("uid",'==',uid));
  //     const allDocs = await getDocs(q);
  //     if(!allDocs.empty){
  //       allDocs.forEach((doc)=>{
  //         const item = doc.data();
  //         const nameOfCategory  = newCategoryName;
  //         console.log(nameOfCategory)
  //       })
  //     }
  //   } catch (error) {
      
  //   }
  // }

  async function DeleteCategory(id,name){
    
      try {
        setDel(id);
        const q = query(collection(db,'categories'),where('categoryId','==',id));
        const docSnap = await getDocs(q);//array of documents
        if(!docSnap.empty){
          await CheckIfPartOfDefaultCategory(uid,name);
          await CheckIfPartOfLimitByCategory(uid,name);
          const docSnapshot = docSnap.docs[0];
          await deleteDoc(docSnapshot.ref)//deleting the reference
          setDel(null);
        }
      } catch (error) {
        console.log("Error : ",error);
        setDel(null);

      }
  }
  

  async function CheckIfPartOfDefaultCategory(uid,name){
    try {
      const q = query(collection(db,'defaultCategories'),where('defaultCategory','==',name));
      const docSnap = await getDocs(q);
      if(!docSnap.empty){
        const docSnapshot = docSnap.docs[0];
        await deleteDoc(docSnapshot.ref);
      }
    } catch (error) {
      console.log("Error occured : ",error);
    }
  }

  async function CheckIfPartOfLimitByCategory(uid,name){
    try {
      const q = query(collection(db,"limitsByCategory"),where('categoryNameChosen','==',name));
      const docSnap = await getDocs(q);
      if(!docSnap.empty){
        const docSnapshot = docSnap.docs[0];
        await deleteDoc(docSnapshot.ref);
      }
    } catch (error) {
      console.log("Error occured : ",error);
    }
  }

  function handleSearch(event){
    const search = event.target.value.trim().toLowerCase();
    if(search===""){
      setCategoryArray(originalCategoryArray);
      setNoResults(false);
    }else{
      const filteredArray = originalCategoryArray.filter((item)=>{
        return item.categoryName.toLowerCase().includes(search)
        })
        if (filteredArray.length === 0) {
          setNoResults(true);
          setCategoryArray([]);
        } else {
          setNoResults(false);
          setCategoryArray(filteredArray);
        }
    }
  }

  //Fetch Limits By Category  : 

  useEffect(()=>{
    console.log(transactionArray);
  },[transactionArray])

  function handleCategoryNameChange(e){
      const val = e.target.value;
        setNewCategoryName(val);
        console.log(newCategoryName);
  }

  async function handleEditClick(id,name){
    setEditItemId(id);
    setNewCategoryName(name);
    // await checkAndUpdateName(uid);
  }

  async function CheckIfCategoryExists(uid){
    try {
        const q = query(collection(db,'categories'),where('uid','==',uid));
        const snapshot  = await getDocs(q);
        let exists = false
        snapshot.docs.forEach((doc)=>{
            const element = doc.data()
            if(element.categoryName.toLowerCase()===newCategoryName.toLowerCase()){
                exists = true;
        }
    });
        return exists;
    } catch (error) {
        console.log("Error : ",error);
    }
    
}

  async function handleEditSave(newName,catName) {
    if(newName===catName){
        setEditItemId(null);
      return;
    }
    if(!newName){
      showInfoSnackbar('Specify a Category', 'error');
      return;
    } 
    const exist = await CheckIfCategoryExists(uid);
    if(exist){
      showSnackbar('Category Already Exists', 'error');
      return;
    }else{
      try {
        setUpdateLoader(true)
        const q = query(collection(db,'categories'),where('uid','==',uid),where('categoryName','==',catName));
        const querySnapshot = await getDocs(q);

        if(!querySnapshot.empty){
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef,{categoryName : newName});
          setUpdateLoader(false);
          setEditItemId(null);
        }
      } catch (error) {
        console.log("Some Error occured : ",error);
        setUpdateLoader(false)
      }
    }
  }

  function cancelChange(id){
    if(editItemId===id){
      setEditItemId(null);
      return;
    }
  }

  const valueFormatter = (value) => `${value} ${displayCurrency}`;

  return (
    <div className="categories--parent--div">
      <div className='category--child--div'> 
        <div className='category--title--div'>
          <p className='category--title'>Categories</p>
          <button type="button" className='add--categories--btn' onClick={OpenAddCategoryModal}>Add Category</button>
        </div>
        <div className='category--left--section'>
          <div className='search----input--button'>
            <input className='search--input' placeholder='Search Categories' onChange={handleSearch}></input>
          </div>
          <div className='show--all--categories'>
            {noResults && originalCategoryArray.length>0 && <p className='no--categories'>No results</p>}
            {loader ?
              <Stack sx={{ color: 'grey.500' }}>
                <CircularProgress color="inherit" size={30} />
              </Stack> : 
              <>
              {categoryArray.length > 0 ? (
                categoryArray.map((item) => (
                  <div key={item.categoryId} id={item.categoryId} className="category--item--div">
                    <p className="pizza10">{item.categoryIcon}</p>
                    {editItemId === item.categoryId ? (
                      <div className="change--name--tick--icon--div">
                        <input
                          type="text"
                          value={newCategoryName}
                          className="change--name--input"
                          onChange={handleCategoryNameChange}
                          maxLength={40}
                        ></input>
                        <div className="tick--cross">
                          {updateLoader && <Stack sx={{ color: 'grey.500' }}>
                            <CircularProgress color="inherit" size={20}/>
                          </Stack>}
                          <i
                            className="bx bx-check"
                            id="check"
                            onClick={() => handleEditSave(newCategoryName,item.categoryName)}
                          ></i>
                          <i 
                            className="bx bx-x" 
                            id="dont--update"
                            onClick={()=>cancelChange(item.categoryId)}
                          ></i>
                        </div>
                      </div>
                    ) : (
                      <p className="name--category">{item.categoryName}</p>
                    )}
                    {!(editItemId === item.categoryId) && <div className="delete--edit-icon">
                      {item.categoryId===del && (
                        <Stack sx={{ color: 'grey.500' }}>
                          <CircularProgress color="inherit" size={20} />
                        </Stack>
                      )}
                      <i className="bx bx-edit-alt" id="edit" onClick={() => handleEditClick(item.categoryId,item.categoryName)}></i>
                      <i className="bx bx-trash" id="trash" onClick={() => DeleteCategory(item.categoryId,`${item.categoryIcon} ${item.categoryName}`)}></i>
                    </div>}
                  </div>
                ))
              ) : empty ? (
                <p className="no--categories">No categories found... Add One!</p>
              ) : null}
            </>   
          }

            
          </div>
        </div>

      </div>
      <StyledSnackbar 
                open={snackbarOpen} 
                autoHideDuration={4000} 
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                TransitionComponent={SlideTransition}
                // onBlur={() => showSnackbar('Salary updated', 'info')}
            >
                <StyledAlert onClose={handleSnackbarClose} severity={snackbarSeverity}>
                    {snackbarMessage}
                </StyledAlert>
      </StyledSnackbar>
      <StyledSnackbar 
                open={snackbarInfoOpen} 
                autoHideDuration={4000} 
                onClose={handleSnackbarInfoClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                TransitionComponent={SlideTransition}
                // onBlur={() => showInfoSnackbar('Salary updated', 'info')}
            >
                <StyledInfoAlert onClose={handleSnackbarInfoClose} severity={snackbarInfoSeverity}>
                    {snackbarInfoMessage}
                </StyledInfoAlert>
      </StyledSnackbar>
      <div className='category--right--section'>
        {/* <div className='bar--chart--div'> 
          <div className='income--spend--chart'>
            <p className='income--spend--title'>Average Income vs Spend <span>(Quarterly)</span></p>
          </div>
          <BarChart
            dataset={analyticalData}
            margin={{ top: 20, bottom: 30, left: 40, right: 30 }}
            xAxis={[{ scaleType: 'band', dataKey:'month'}]}
            series={[
              { dataKey: 'income', label: 'Income', valueFormatter },
              { dataKey: 'spend', label: 'Spend', valueFormatter },
            ]}
            width={500}
            height={300}
            options={{
              yAxis: {
                tickSize: 0,
                axisLineStyle: {
                  stroke: 'white',
                },
              },
            }}
          />
        </div> */}
        {/* <motion.div className="pie--div">
          <div className='pie--title--div'>
            <p className='pie--title'>Category-wise Expenditure <span>(in {displayCurrency})</span></p>
          </div>
        <PieChart
                    className="pie--chart"
                    series={[
                        {
                            innerRadius: 70,
                            outerRadius: 110,
                            paddingAngle: 2,
                            cornerRadius: 4,
                            startAngle: -180,
                            endAngle: 180,
                            cx: 150,
                            cy: 120,
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
                />
        </motion.div> */}
        <div>

        </div>
      </div>
    </div>
  );
}
