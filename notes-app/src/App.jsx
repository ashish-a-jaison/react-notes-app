import {useState,useEffect} from 'react'

function App() {
const[title,settitle]=useState("")
const[content,setcontent]=useState("")
const[notes,setnotes]=useState(()=>{
  const savedNotes=localStorage.getItem("notes")
  return savedNotes?JSON.parse(savedNotes):[]
})
const[editId,seteditId]=useState(null)
const[search,setsearch]=useState("")
const[showarchieved,setshowarchieved]=useState(false)
const[sortorder,setsortorder]=useState("newest")
const searchText = search.trim().toLowerCase()

const filterednotes=notes.filter((note)=>
(showarchieved?note.archieved===true:note.archieved!==true)&&
( note.title.toLowerCase().includes(searchText) ||
  note.content.toLowerCase().includes(searchText)  
)
)

const sortednotes=[...filterednotes].sort((a,b)=>{
  const dateA = new Date(a.createdAt || 0).getTime()
  const dateB = new Date(b.createdAt || 0).getTime()
  if(sortorder==="newest"){
    return dateB-dateA
  }
    return dateA-dateB
})
const[color,setcolor]=useState("white")

useEffect(()=>{
localStorage.setItem("notes",JSON.stringify(notes))
},[notes])

function addNote(){
  if(title.trim()==="" && content.trim()===""){
    alert("please enter title or content")
    return
  }
  if(editId!==null){
    setnotes(
      notes.map((note)=>note.id===editId?{
        ...note,
        title:title,
        content:content,
        updatedAt: new Date().toISOString(),
        color:color }:note)
    )
    seteditId(null)
  }else{
    const newNote = {
    id: Date.now(),
    title: title,
    content: content,
    color:color,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archieved:false
    }    
    setnotes((currentNotes) => [...currentNotes, newNote])
    setsearch("")
    setshowarchieved(false)
  }
    settitle("")
    setcontent("")
    setcolor("white")
  }
function deleteNote(id){
  setnotes(notes.filter((note)=>note.id
  !==id))
}

function archieveNote(id){
setnotes(notes.map((note)=>note.id===id?{...note,archieved:true}:note))
}

function unarchieveNote(id){
  setnotes(notes.map((note)=>note.id===id?{...note,archieved:false}:note))
}

function editNote(note){
  settitle(note.title)
  setcontent(note.content)
  seteditId(note.id)
  setcolor(note.color || "white")
}
return(
  <>
  <div className="min-h-screen bg-stone-100 p-6">
    <div className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">My Notes</h1>
  <input
  type="text"
  placeholder="Search notes"
  value={search}
  onChange={(e)=>setsearch(e.target.value)}
  className="mb-4 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
  /> 

  <input
  type="text"
  placeholder="enter note title"
  value={title}
  onChange={(e)=>settitle(e.target.value)}
  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
  />

  <textarea
  rows={5}
  placeholder="write your note..."
  value={content}
  onChange={(e)=>setcontent(e.target.value)}
  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
  />
  <div className="mt-3 flex gap-3">
    {["white","lightyellow","lightgreen","lightblue","pink"].map((c)=>(
      <button
      key={c}
      type="button"
      onClick={()=>setcolor(c)}
      style={{backgroundColor:c}}
      className="h-8 w-8 rounded-full border border-gray-300 hover:border-gray-500"
      />
    ))}
  </div>

  <button onClick={addNote}
  className="mt-4 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
  >{editId!==null?"Update Note":"Add Note"}</button>
  {notes.some((note) => note.archieved === true) && (
  <button onClick={() => setshowarchieved(!showarchieved)}
    className="ml-3 mt-4 rounded-lg bg-gray-700 px-5 py-2 font-semibold text-white hover:bg-gray-800"
  >{showarchieved ? "View Notes" : "View Archived"}</button>
)} 
<select
  value={sortorder}
  onChange={(e) => setsortorder(e.target.value)}
  className="ml-3 rounded-lg border border-gray-300 p-2"
>
  <option value="newest">Newest First</option>
  <option value="oldest">Oldest First</option>
</select>
<div className="mt-6 space-y-3">
  {sortednotes.length === 0 ? (
    <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-gray-500">
      {showarchieved
        ? "No archived notes yet."
        : searchText
          ? "No notes match your search."
          : "No notes yet. Create your first note above."}
    </p>
  ) : sortednotes.map((note)=>(
    <div key={note.id}
    style={{ backgroundColor: note.color || "white" }}
    className="rounded-lg border border-gray-200 p-4">
      <h2 className="text-lg font-bold">{note.title}</h2>
      <p className="mt-2 whitespace-pre-wrap text-gray-600">{note.content}</p>

  <p className="mt-3 text-xs text-gray-500">
  Created: {note.createdAt ? new Date(note.createdAt).toLocaleString():"Date unavailable"}
  </p>

  <p className="mt-1 text-xs text-gray-500">
  Last edited: {note.updatedAt ? new Date(note.updatedAt).toLocaleString():"Not edited yet"}
  </p>

  <button onClick={() => deleteNote(note.id)}
    className="mt-3 mr-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
    >Delete</button>

  <button onClick={()=>editNote(note)}
    className="mt-3 mr-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >Edit</button>

{showarchieved ? (
  <button onClick={() => unarchieveNote(note.id)}
    className="mt-3 mr-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
  >Unarchive</button>
) : (
  <button onClick={() => archieveNote(note.id)}
    className="mt-3 mr-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
  >Archive</button>
)}
</div>
  ))}
</div>
</div>
</div>
</>


)
}

export default App