// Import dependencies
import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';
import './App.css';
import { drawRect } from './utilities';
import FlipMove from 'react-flip-move';

function App() {
	const webcamRef = useRef(null);
	const canvasRef = useRef(null);

	const [data, setData] = useState([]);
	const [itemData, setItemData] = useState([]);

	// Main function
	const runCoco = async () => {
		const net = await cocossd.load();
		console.log('Handpose model loaded.');
		//  Loop and detect hands
		setInterval(() => {
			detect(net);
		}, 10);
	};

	const detect = async (net) => {
		// Check data is available
		if (
			typeof webcamRef.current !== 'undefined' &&
			webcamRef.current !== null &&
			webcamRef.current.video.readyState === 4
		) {
			// Get Video Properties
			const video = webcamRef.current.video;
			const videoWidth = webcamRef.current.video.videoWidth;
			const videoHeight = webcamRef.current.video.videoHeight;

			// Set video width
			webcamRef.current.video.width = videoWidth;
			webcamRef.current.video.height = videoHeight;

			// Set canvas height and width
			canvasRef.current.width = videoWidth;
			canvasRef.current.height = videoHeight;

			// Make Detections
			const obj = await net.detect(video);

			// Draw mesh
			const ctx = canvasRef.current.getContext('2d');
			drawRect(obj, ctx);
		}
	};

	useEffect(() => {
		runCoco();
	}, [runCoco]);

	const capture = useCallback(async () => {
		const imageSources = [];
		const startTime = new Date().getTime();

		while (imageSources.length < 25) {
			const imageSrc = webcamRef.current.getScreenshot();
			const timestamp = new Date().getTime();
			imageSources.push({
				img: imageSrc,
				title: `Test Title - ${timestamp}`,
				author: 'Author name',
			});

			if (new Date().getTime() - startTime >= 10000) {
				// Adjusted to 10 seconds
				console.log('Timeout: Could not capture all images within 10 seconds');
				break;
			}
		}

		// Assuming catImgs is an array of objects where each object represents a category
		// and has a 'images' array to push images into.
		const getRandomIntInclusive = (min, max) => {
			min = Math.ceil(min);
			max = Math.floor(max);
			return Math.floor(Math.random() * (max - min + 1) + min);
		};

		let remainingImages = [...imageSources]; // Copy of the original data
		const transformedData = [];
		let categoryIndex = 0;

		while (remainingImages.length > 0) {
			// Decide the number of images for the current category
			// Ensure at least one image per category and do not exceed the number of remaining images
			const numImagesForCategory = getRandomIntInclusive(
				1,
				remainingImages.length
			);

			const imagesForCurrentCategory = remainingImages
				.splice(0, numImagesForCategory)
				.map((item) => item.img);

			transformedData.push({
				name: `Category ${++categoryIndex}`,
				images: imagesForCurrentCategory,
			});
		}

		console.log(transformedData);
		const sortedArray = getSortedArray(transformedData);
		setData(sortedArray);
		console.log('Captured images:', transformedData);

		setItemData((prevItemData) => [...prevItemData, ...imageSources]);
		console.log('Captured images:', imageSources.length);
	}, [webcamRef]);

	const getSortedArray = (imgData = []) => {
		const sortedArr = imgData.sort((a, b) => {
			return b.images.length - a.images.length;
		});
		return sortedArr;
	};

	return (
		<div className='App'>
			<header className='App-header'>
				<Webcam
					ref={webcamRef}
					muted={true}
					style={{
						position: 'absolute',
						marginLeft: 'auto',
						marginRight: 'auto',
						left: 0,
						right: 0,
						textAlign: 'center',
						zindex: 9,
						width: 640,
						height: 480,
					}}
				/>

				<canvas
					ref={canvasRef}
					style={{
						position: 'absolute',
						marginLeft: 'auto',
						marginRight: 'auto',
						left: 0,
						right: 0,
						textAlign: 'center',
						zindex: 8,
						width: 640,
						height: 480,
					}}
				/>
			</header>
			<button onClick={capture}>Capture</button>
			<div className='progress-bar-container'>
				<FlipMove
					duration={500}
					staggerDelayBy={500}
					staggerDurationBy={1000}
					style={{ zIndex: -1 }}
				>
					{data.map((category) => (
						<div className='row' key={category.name}>
							<div className='col-md-10'>
								<div className='progress'>
									<div
										className='progress-bar'
										role='progressbar'
										style={{ width: `${category.images.length}%` }}
										aria-valuenow={category.images.length}
										aria-valuemin='0'
										aria-valuemax={category.images.length}
									>
										{category.images.length}
									</div>
								</div>
							</div>
							<div className='col-md-2'>
								<div className='label'>{category.name}</div>
							</div>
						</div>
					))}
				</FlipMove>
			</div>
		</div>
	);
}

export default App;
