import React, { useState } from "react";
import { toast } from "react-toastify";
import Spinner from "../components/Spinner";
import {useNavigate} from "react-router-dom"
import {addDoc, collection, serverTimestamp} from "firebase/firestore"
import {db} from "../firebase"
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { getAuth } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
export default function CreateListing() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [geolocationEnabled, setGeolocationEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "rent",
    name: "",
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    furnished: false,
    address: "",
    description: "",
    offer: true,
    regularPrice: 0,
    discountedPrice: 0,
    latitude: 0,
    longitude: 0,
    images: {},
  });
  const {
    type,
    name,
    bedrooms,
    bathrooms,
    parking,
    furnished,
    address,
    description,
    offer,
    regularPrice,
    discountedPrice,
    latitude,
    longitude,
    images,
  } = formData;
  function onChange(e) {
    let boolean = null;
    if (e.target.value === "true") {
      boolean = true;
    }
    if (e.target.value === "false") {
      boolean = false;
    }
    //files
    if (e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        images: e.target.files,
      }));
    }
    //text/boolean/ number
    if (!e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }));
    }
  }
  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    if (+discountedPrice >= +regularPrice) {
      setLoading(false);
      toast.error("Discounted price needs to be less than regular price");

      return;
    }
    if (images.length > 6) {
      setLoading(false);
      toast.error("maximum 6 images are allowed");
      return;
    }
    let geolocation = {};
    let location;
    if (geolocationEnabled) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GEOCODE_API_KEY}`
      );
      const data = await response.json();
      console.log(data);
      geolocation.lat = data.results[0]?.geometry.location.lat ?? 0;
      geolocation.lng = data.results[0]?.geometry.location.lng ?? 0;
      location = data.status === "ZERO_RESULTS" && undefined;
      if (location === undefined ) {
        setLoading(false);
        toast.error("please enter a correct address");
        return;
      } else {
        geolocation.lat = latitude;
        geolocation.lng = longitude;
      }
      async function storeImage(image) {
        return new Promise((resolve, reject) => {
          const storage = getStorage();
          const filename = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;
          const storageRef = ref(storage, filename);
          const uploadTask = uploadBytesResumable(storageRef, image);
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              // Observe state change events such as progress, pause, and resume
              // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log("Upload is " + progress + "% done");
              switch (snapshot.state) {
                case "paused":
                  console.log("Upload is paused");
                  break;
                case "running":
                  console.log("Upload is running");
                  break;
              }
            },
            (error) => {
              // Handle unsuccessful uploads
              reject(error)
            },
            () => {
              // Handle successful uploads on complete
              // For instance, get the download URL: https://firebasestorage.googleapis.com/...
              getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                resolve(downloadURL);
              });
            }
          );
        });
      }

      const imgUrls = await Promise.all(
        [...images]
          .map((image) => storeImage(image)))
          .catch((error) => {
            setLoading(false);
            toast.error("images not uploaded");
            return;
          }
      );
      const formDataCopy = {
        ...formData,
        imgUrls,
        geolocation,
        timestamps: serverTimestamp(),
        useRef: auth.currentUser.uid,


      }
      delete formDataCopy.images;
      !formDataCopy.offer && delete formDataCopy.discountedPrice;
      delete formDataCopy.latitude;
      delete formDataCopy.longitude;
      const docRef = await addDoc(
      collection(db, "listings"),{imgUrls:imgUrls},formDataCopy);
      setLoading(false)
      toast.success("Listings created");
      navigate(`/category/${formDataCopy.type}/${docRef.id}`)
    }
   
  }
  if (loading) {
    return <Spinner />;
  }
  return (
    <main className="max-w-md px-2 mx-auto ">
      <h1 className="text-3xl text-center mt-6 font-bold">Create listing</h1>
      <form onSubmit={onSubmit}>
        <p className="text-lg mt-6 font-semibold">Sell / Rent</p>
        <div className="flex">
          <button
            type="button"
            id="type"
            value="sale"
            onClick={onChange}
            className={`mr-3 px-7 py-3
                 font-medium text-sm 
                 uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition duration-150 ease-in-out 
                 w-full ${
                   type === "rent"
                     ? "bg-white text-black"
                     : "bg-slate-600 text-white"
                 }`}
          >
            sell
          </button>
          <button
            type="button"
            id="type"
            value="rent"
            onClick={onChange}
            className={`ml-3 px-7 py-3
                 font-medium text-sm 
                 uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition duration-150 ease-in-out 
                 w-full ${
                   type === "sale"
                     ? "bg-white text-black"
                     : "bg-slate-600 text-white"
                 }`}
          >
            rent
          </button>
        </div>
        <p className="text-lg mt-6 font-semibold">Name</p>
        <input
          type="text"
          id="name"
          value={name}
          onChange={onChange}
          placeholder="Name"
          maxLength="32"
          minLength="10"
          required
          className="w-full px-4 py-2 text-xl text-gray-700
            bg-white border border-gray-300 rounded transition duration-150 ease-in-out 
            focus:text-gray-700 focus:bg-white focus:border-slate-600 mb-6"
        />
        <div className="flex space-x-6 justify-start">
          <div className="">
            <p className="text-lg font-semibold">Beds</p>
            <input
              type="number"
              id="bedrooms"
              value={bedrooms}
              min="1"
              max="50"
              onChange={onChange}
              required
              className="w-full px-4 py-2 text-xl text-gray-700
                    bg-white border border-gray-700 rounded transition duration-150
                    ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 text-center
                    "
            />
          </div>
          <div className="">
            <p className="text-lg font-semibold">Baths</p>
            <input
              type="number"
              id="bathrooms"
              value={bathrooms}
              onChange={onChange}
              min="1"
              max="50"
              required
              className="w-full px-4 py-2 text-xl text-gray-700
                    bg-white border border-gray-700 rounded transition duration-150
                    ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 text-center
                    "
            />
          </div>
        </div>
        <p className="text-lg mt-6 font-semibold">Parking/ Spot</p>
        <div className="flex">
          <button
            type="button"
            id="parking"
            value={true}
            onClick={onChange}
            className={`mr-3 px-7 py-3
                 font-medium text-sm 
                 uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition duration-150 ease-in-out 
                 w-full ${
                   !parking ? "bg-white text-black" : "bg-slate-600 text-white"
                 }`}
          >
            yes
          </button>
          <button
            type="button"
            id="parking"
            value={false}
            onClick={onChange}
            className={`ml-3 px-7 py-3
                 font-medium text-sm 
                 uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition duration-150 ease-in-out 
                 w-full ${
                   parking ? "bg-white text-black" : "bg-slate-600 text-white"
                 }`}
          >
            no
          </button>
        </div>
        <p className="text-lg mt-6 font-semibold">Furnished</p>
        <div className="flex">
          <button
            type="button"
            id="furnished"
            value={true}
            onClick={onChange}
            className={`mr-3 px-7 py-3
                 font-medium text-sm 
                 uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition duration-150 ease-in-out 
                 w-full ${
                   !furnished
                     ? "bg-white text-black"
                     : "bg-slate-600 text-white"
                 }`}
          >
            yes
          </button>
          <button
            type="button"
            id="furnished"
            value={false}
            onClick={onChange}
            className={`ml-3 px-7 py-3
                 font-medium text-sm 
                 uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition duration-150 ease-in-out 
                 w-full ${
                   furnished ? "bg-white text-black" : "bg-slate-600 text-white"
                 }`}
          >
            no
          </button>
        </div>
        <p className="text-lg mt-6 font-semibold">Address</p>
        <textarea
          type="text"
          id="address"
          value={address}
          onChange={onChange}
          placeholder="Address"
          maxLength="32"
          minLength="10"
          required
          className="w-full px-4 py-2 text-xl text-gray-700
            bg-white border border-gray-300 rounded transition duration-150 ease-in-out 
            focus:text-gray-700 focus:bg-white focus:border-slate-600 mb-6"
        />
        {!geolocationEnabled && (
          <div className="flex space-x-6 justify-start mb-6">
            <div className="">
              <p className="text-lg font-semibold">Latitude</p>
              <input
                type="number"
                id="latitude"
                value={latitude}
                onChange={onChange}
                required
                min="-90"
                max="90"
                className="w-full px-4 py-2 text-xl 
             text-gray-700 bg-white border border-gray-300
             rounded transition duration-150 ease-in-out
             focus:bg-white focus:text-gray-700 focus:border-slate-600
             text-center"
              />
            </div>
            <div className="">
              <p
                className="text-lg 
            font-semibold"
              >
                longitude
              </p>
              <input
                type="number"
                id="longitude"
                value={longitude}
                onChange={onChange}
                required
                min="-180"
                max="180"
                className="w-full px-4 py-2 text-xl 
             text-gray-700 bg-white border border-gray-300
             rounded transition duration-150 ease-in-out
             focus:bg-white focus:text-gray-700 focus:border-slate-600
             text-center"
              />
            </div>
          </div>
        )}

        <p className="text-lg  font-semibold">Description</p>
        <textarea
          type="text"
          id="description"
          value={description}
          onChange={onChange}
          placeholder="description"
          maxLength="32"
          minLength="10"
          required
          className="w-full px-4 py-2 text-xl text-gray-700
            bg-white border border-gray-300 rounded transition duration-150 ease-in-out 
            focus:text-gray-700 focus:bg-white focus:border-slate-600 mb-6"
        />

        <p className="text-lg font-semibold">Offer</p>
        <div className="flex mb-6">
          <button
            type="button"
            id="offer"
            value={true}
            onClick={onChange}
            className={`mr-3 px-7 py-3
                 font-medium text-sm 
                 uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition duration-150 ease-in-out 
                 w-full ${
                   !offer ? "bg-white text-black" : "bg-slate-600 text-white"
                 }`}
          >
            yes
          </button>
          <button
            type="button"
            id="offer"
            value={false}
            onClick={onChange}
            className={`ml-3 px-7 py-3
                 font-medium text-sm 
                 uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition duration-150 ease-in-out 
                 w-full ${
                   offer ? "bg-white text-black" : "bg-slate-600 text-white"
                 }`}
          >
            no
          </button>
        </div>
        <div className="flex item-center mb-6">
          <div className="">
            <p className="text-lg font-semibold">Regular Price</p>
            <div className="flex w-full justify-center items-center">
              <input
                type="number"
                id="regularPrice"
                value={regularPrice}
                onChange={onChange}
                min="50"
                max="40000000"
                required
                className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300
                        rounded transition duration-150 ease-in-out focus:text-gray-700
                         focus:bg-white focus:border-slate-600 text-center"
              />
              {type === "rent" && (
                <dir className="">
                  <p className="text-md w-full whitespace-nowrap ">$ / month</p>
                </dir>
              )}
            </div>
          </div>
        </div>
        {offer && (
          <div className="flex item-center mb-6">
            <div className="">
              <p className="text-lg font-semibold">Discounted Price</p>
              <div className="flex w-full justify-center items-center">
                <input
                  type="number"
                  id="discountedPrice"
                  value={discountedPrice}
                  onChange={onChange}
                  min="50"
                  max="40000000"
                  required={offer}
                  className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300
                        rounded transition duration-150 ease-in-out focus:text-gray-700
                         focus:bg-white focus:border-slate-600 text-center"
                />
                {type === "rent" && (
                  <dir className="">
                    <p className="text-md w-full whitespace-nowrap ">
                      $ / month
                    </p>
                  </dir>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="mb-6">
          <p className="text-lg font-semibold">Images</p>
          <p className="text-gray-600">
            The First Image will be the cover(max 6)
          </p>
          <input
            type="file"
            name=""
            id="images"
            onChange={onChange}
            accept=".jpg,.png,.jpeg"
            multiple
            required
            className="w-full px-3 py-1.5 text-gray-700 bg-white border border border-gray-300
            rounded transition duration-150 ease-in-out focus:bg-white focus:border-slate-600"
          />
        </div>
        <button
          type="submit"
          className="mb-6 w-full px-7 py-3
        bg-blue-600 text-white font-medium text-sm uppercase rounded shadow-md hover:bg-blue-700
         hover:shadow-lg focus:bg-blue-700 focus: shadow-lg active:bg-blue-800 active:shadow-lg 
         duration-150 ease-in-out"
        >
          Create Listing
        </button>
      </form>
    </main>
  );
}
