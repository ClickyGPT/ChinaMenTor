import React, { useState, useRef, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import LoadingSpinner from './components/LoadingSpinner';
import { analyzeImage, generateCaptions, editImage, checkAndSelectApiKey, loadImage } from './services/geminiService';
import { MemeCaption, MemeStyle, CommunityPost, EditState } from './types';
import { FONT_OPTIONS, COLOR_OPTIONS, MEME_STYLES, INITIAL_COMMUNITY_POSTS, CHINA_MENTOR_IMAGE } from './constants';

type AppTab = 'create' | 'community';
type CreateStep = 'upload' | 'edit' | 'finalize';

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<AppTab>('create');
  const [currentStep, setCurrentStep] = useState<CreateStep>('upload');

  // Data State
  const [rawImage, setRawImage] = useState<string | null>(null); // The original uploaded image
  const [workingImage, setWorkingImage] = useState<string | null>(null); // Image being edited
  const [finalImage, setFinalImage] = useState<string | null>(null); // Image passed to meme generator
  
  // Editor State
  const [editState, setEditState] = useState<EditState>({ scale: 1, rotation: 0, offsetX: 0, offsetY: 0 });
  const [aiEditPrompt, setAiEditPrompt] = useState('');
  
  // Generator State
  const [captions, setCaptions] = useState<string[]>([]);
  const [textOverlays, setTextOverlays] = useState<MemeCaption[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<MemeStyle>('classic');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Community State
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);

  // Refs
  const editorCanvasRef = useRef<HTMLCanvasElement>(null);
  const memeCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // --- Workflow Handlers ---

  const handleImageUpload = (base64Image: string) => {
    setRawImage(base64Image);
    setWorkingImage(base64Image);
    setCurrentStep('edit');
    // Reset editor state
    setEditState({ scale: 1, rotation: 0, offsetX: 0, offsetY: 0 });
    setAiEditPrompt('');
  };

  const handleEditComplete = async () => {
    if (!editorCanvasRef.current) return;
    const dataUrl = editorCanvasRef.current.toDataURL('image/jpeg', 0.95);
    const base64 = dataUrl.split(',')[1];
    setFinalImage(base64);
    setCurrentStep('finalize');
    // Reset generator state
    setTextOverlays([]);
    setCaptions([]);
    setAnalysisResult('');
  };

  const handleRestart = () => {
    setRawImage(null);
    setWorkingImage(null);
    setFinalImage(null);
    setCurrentStep('upload');
    setCaptions([]);
    setTextOverlays([]);
    setAnalysisResult('');
    setActiveTab('create');
  };

  // --- Image Editor Logic ---

  const applyAiEdit = async () => {
    if (!workingImage || !aiEditPrompt.trim()) return;
    
    setIsLoading(true);
    setLoadingMessage('AI is processing your edit request...');
    try {
      // We use rawImage or workingImage? Using workingImage allows chained edits.
      // However, sending a huge canvas capture might be slow. 
      // Let's assume workingImage (base64) is the source.
      const result = await editImage(workingImage, aiEditPrompt);
      if (result) {
        setWorkingImage(result);
        setAiEditPrompt('');
      }
    } catch (e) {
      alert("Failed to edit image: " + (e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEditorCanvas = async () => {
    const canvas = editorCanvasRef.current;
    if (!canvas || !workingImage) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = await loadImage(`data:image/jpeg;base64,${workingImage}`);
    
    // Set canvas size to square 600x600 for standardized output or keep aspect?
    // Let's keep aspect of viewport constant (e.g. 500x500) to "Crop".
    canvas.width = 500;
    canvas.height = 500;

    ctx.fillStyle = '#1f2937'; // gray-800 background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Center logic
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.translate(editState.offsetX, editState.offsetY);
    ctx.rotate((editState.rotation * Math.PI) / 180);
    ctx.scale(editState.scale, editState.scale);
    
    // Draw image centered
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };

  useEffect(() => {
    if (currentStep === 'edit') {
      renderEditorCanvas();
    }
  }, [currentStep, workingImage, editState]);

  // Editor Mouse Events for Pan
  const handleEditorMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };
  const handleEditorMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    setEditState(prev => ({ ...prev, offsetX: prev.offsetX + dx, offsetY: prev.offsetY + dy }));
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };
  const handleEditorMouseUp = () => {
    isDraggingRef.current = false;
  };

  // --- Meme Generator Logic ---

  const handleAnalyze = async () => {
    if (!finalImage) return;
    setIsLoading(true);
    setLoadingMessage('Analyzing image context...');
    try {
      await checkAndSelectApiKey();
      const result = await analyzeImage(finalImage);
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicCaptions = async () => {
    if (!finalImage) return;
    setIsLoading(true);
    setLoadingMessage('Generating hilarious captions...');
    try {
      await checkAndSelectApiKey();
      const generated = await generateCaptions(finalImage);
      setCaptions(generated);
    } catch (e) {
      alert("Error generating captions.");
    } finally {
      setIsLoading(false);
    }
  };

  const addCaption = (text: string) => {
    const newCaption: MemeCaption = {
      id: Date.now().toString(),
      text: text,
      x: 250, // Center width (assuming 500 width)
      y: textOverlays.length === 0 ? 50 : 450, // First at top, second at bottom
      color: MEME_STYLES[selectedStyle].color,
      fontSize: 40,
      fontFamily: MEME_STYLES[selectedStyle].font,
    };
    setTextOverlays([...textOverlays, newCaption]);
  };

  const renderMemeCanvas = async () => {
    const canvas = memeCanvasRef.current;
    if (!canvas || !finalImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = await loadImage(`data:image/jpeg;base64,${finalImage}`);
    canvas.width = 500;
    canvas.height = 500;

    // Apply Filter Style
    const style = MEME_STYLES[selectedStyle];
    ctx.filter = style.filter;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    ctx.filter = 'none'; // Reset filter for text

    // Draw Text
    textOverlays.forEach(cap => {
      ctx.font = `bold ${cap.fontSize}px ${style.font || cap.fontFamily}`;
      ctx.fillStyle = cap.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Stroke for Classic
      if (style.strokeWidth > 0) {
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = style.strokeWidth;
        ctx.strokeText(cap.text, cap.x, cap.y);
      }

      ctx.fillText(cap.text, cap.x, cap.y);
    });
  };

  useEffect(() => {
    if (currentStep === 'finalize') {
      renderMemeCanvas();
    }
  }, [currentStep, finalImage, textOverlays, selectedStyle]);

  // --- Community Logic ---
  
  const handleShare = () => {
    if (!memeCanvasRef.current) return;
    const dataUrl = memeCanvasRef.current.toDataURL('image/jpeg');
    const newPost: CommunityPost = {
      id: Date.now().toString(),
      imageUrl: dataUrl,
      title: textOverlays.length > 0 ? textOverlays[0].text : 'My Awesome Meme',
      author: 'Anonymous',
      likes: 0,
      timestamp: Date.now(),
      userVote: null,
    };
    setCommunityPosts([newPost, ...communityPosts]);
    setActiveTab('community');
    handleRestart();
  };

  const handleVote = (postId: string, type: 'up' | 'down') => {
    setCommunityPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      
      let newLikes = post.likes;
      let newVote = post.userVote;

      if (post.userVote === type) {
        // Toggle off
        newLikes = type === 'up' ? newLikes - 1 : newLikes + 1;
        newVote = null;
      } else {
        // Change vote
        if (post.userVote === 'up') newLikes -= 1;
        if (post.userVote === 'down') newLikes += 1;
        
        newLikes = type === 'up' ? newLikes + 1 : newLikes - 1;
        newVote = type;
      }
      
      return { ...post, likes: newLikes, userVote: newVote };
    }));
  };

  // --- Render Helpers ---
  
  const renderCreateTab = () => (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        <div className={`flex items-center ${currentStep === 'upload' ? 'text-blue-400' : 'text-gray-500'}`}>
          <span className="material-symbols-outlined mr-2">upload_file</span>
          <span className="font-bold">Upload</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-700 mx-4"></div>
        <div className={`flex items-center ${currentStep === 'edit' ? 'text-blue-400' : 'text-gray-500'}`}>
          <span className="material-symbols-outlined mr-2">crop_rotate</span>
          <span className="font-bold">Edit</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-700 mx-4"></div>
        <div className={`flex items-center ${currentStep === 'finalize' ? 'text-blue-400' : 'text-gray-500'}`}>
          <span className="material-symbols-outlined mr-2">auto_awesome</span>
          <span className="font-bold">Meme</span>
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
        {currentStep === 'upload' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Start with an image</h2>
            <ImageUploader onImageUpload={handleImageUpload} isLoading={false} />
          </div>
        )}

        {currentStep === 'edit' && (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Canvas */}
            <div className="flex-1 flex justify-center bg-gray-900 rounded-lg p-2 overflow-hidden relative">
                <canvas
                  ref={editorCanvasRef}
                  className="cursor-move rounded shadow-lg max-w-full h-auto"
                  onMouseDown={handleEditorMouseDown}
                  onMouseMove={handleEditorMouseMove}
                  onMouseUp={handleEditorMouseUp}
                  onMouseLeave={handleEditorMouseUp}
                />
                <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded text-xs">
                    Drag to move
                </div>
            </div>
            
            {/* Right: Controls */}
            <div className="w-full md:w-80 space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-2">tune</span>
                  Basic Adjustments
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Zoom</label>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={editState.scale}
                      onChange={(e) => setEditState(prev => ({...prev, scale: parseFloat(e.target.value)}))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Rotation</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditState(prev => ({...prev, rotation: prev.rotation - 90}))}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded"
                      >
                        -90°
                      </button>
                      <button 
                        onClick={() => setEditState(prev => ({...prev, rotation: prev.rotation + 90}))}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded"
                      >
                        +90°
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-bold text-lg mb-4 flex items-center text-purple-400">
                  <span className="material-symbols-outlined mr-2">auto_fix</span>
                  AI Edit (Gemini)
                </h3>
                <textarea
                  className="w-full bg-gray-700 rounded p-2 text-sm mb-2"
                  placeholder='e.g., "Make it cyber punk style" or "Remove the background"'
                  value={aiEditPrompt}
                  onChange={(e) => setAiEditPrompt(e.target.value)}
                  rows={3}
                />
                <button
                  onClick={applyAiEdit}
                  disabled={isLoading || !aiEditPrompt}
                  className={`w-full py-2 rounded font-bold flex items-center justify-center ${isLoading || !aiEditPrompt ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500'}`}
                >
                  {isLoading ? 'Processing...' : 'Apply AI Edit'}
                </button>
              </div>

              <button
                onClick={handleEditComplete}
                className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-lg mt-4"
              >
                Next: Add Captions
              </button>
            </div>
          </div>
        )}

        {currentStep === 'finalize' && (
          <div className="flex flex-col lg:flex-row gap-8">
             {/* Left: Meme Canvas */}
             <div className="flex-1 flex flex-col items-center">
               <canvas
                  ref={memeCanvasRef}
                  className="rounded-lg shadow-2xl border border-gray-700 max-w-full h-auto"
               />
               <div className="flex gap-2 mt-4 w-full justify-center">
                  <button 
                    onClick={handleShare}
                    className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-500 rounded-full font-bold"
                  >
                    <span className="material-symbols-outlined mr-2">public</span>
                    Share to Community
                  </button>
                  <button 
                    onClick={() => {
                       const link = document.createElement('a');
                       link.download = 'meme.jpg';
                       link.href = memeCanvasRef.current?.toDataURL() || '';
                       link.click();
                    }}
                    className="flex items-center px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-full font-bold"
                  >
                    <span className="material-symbols-outlined mr-2">download</span>
                    Download
                  </button>
               </div>
             </div>

             {/* Right: Tools */}
             <div className="w-full lg:w-96 space-y-6">
                
                {/* Style Selector */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                  <h3 className="font-bold mb-3 flex items-center">
                    <span className="material-symbols-outlined mr-2">palette</span>
                    Meme Style
                  </h3>
                  <div className="flex gap-2">
                    {(Object.keys(MEME_STYLES) as MemeStyle[]).map(style => (
                      <button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        className={`flex-1 py-2 text-sm rounded capitalize transition-colors ${selectedStyle === style ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{MEME_STYLES[selectedStyle].description}</p>
                </div>

                {/* Magic Captions */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                   <h3 className="font-bold mb-3 flex items-center text-yellow-400">
                    <span className="material-symbols-outlined mr-2">bolt</span>
                    AI Features
                  </h3>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-sm mr-1">search</span>
                      Analyze
                    </button>
                     <button
                      onClick={handleMagicCaptions}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 py-2 rounded text-sm font-bold flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-sm mr-1">auto_awesome</span>
                      Magic Captions
                    </button>
                  </div>
                  
                  {isLoading && <LoadingSpinner />}
                  
                  {analysisResult && !isLoading && (
                    <div className="text-xs bg-gray-800 p-2 rounded mb-4 text-gray-300 border border-gray-600">
                      <strong>Analysis:</strong> {analysisResult}
                    </div>
                  )}

                  <div className="space-y-2">
                    {captions.map((cap, idx) => (
                      <button
                        key={idx}
                        onClick={() => addCaption(cap)}
                        className="w-full text-left p-2 bg-gray-800 hover:bg-gray-700 rounded text-sm border border-gray-700 transition-colors"
                      >
                        "{cap}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Text */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                   <h3 className="font-bold mb-3 flex items-center">
                    <span className="material-symbols-outlined mr-2">text_fields</span>
                    Custom Text
                  </h3>
                  <div className="flex gap-2">
                    <input
                      id="custom-text-input"
                      type="text"
                      placeholder="Type something..."
                      className="flex-1 bg-gray-800 rounded px-3 py-2 text-sm border border-gray-700"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                           addCaption(e.currentTarget.value);
                           e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('custom-text-input') as HTMLInputElement;
                        if (input.value) {
                          addCaption(input.value);
                          input.value = '';
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 px-3 rounded"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Active Text Layers List */}
                  <div className="mt-4 space-y-2">
                    {textOverlays.map((layer, idx) => (
                      <div key={layer.id} className="flex items-center justify-between bg-gray-800 p-2 rounded text-xs">
                        <span className="truncate max-w-[150px]">{layer.text}</span>
                        <div className="flex gap-1">
                           <button onClick={() => {
                              const newOverlays = [...textOverlays];
                              newOverlays[idx].y -= 10;
                              setTextOverlays(newOverlays);
                           }} className="p-1 hover:bg-gray-700 rounded"><span className="material-symbols-outlined text-xs">arrow_upward</span></button>
                            <button onClick={() => {
                              const newOverlays = [...textOverlays];
                              newOverlays[idx].y += 10;
                              setTextOverlays(newOverlays);
                           }} className="p-1 hover:bg-gray-700 rounded"><span className="material-symbols-outlined text-xs">arrow_downward</span></button>
                           <button onClick={() => {
                             setTextOverlays(textOverlays.filter(t => t.id !== layer.id));
                           }} className="p-1 hover:bg-red-900 text-red-400 rounded"><span className="material-symbols-outlined text-xs">close</span></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCommunityTab = () => (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communityPosts.map((post) => (
          <div key={post.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg hover:shadow-2xl transition-shadow">
            <div className="relative aspect-square bg-gray-900">
               <img src={post.imageUrl} alt={post.title} className="w-full h-full object-contain" />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 truncate">{post.title}</h3>
              <div className="flex items-center justify-between text-gray-400 text-sm">
                <span>@{post.author}</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleVote(post.id, 'up')}
                    className={`flex items-center gap-1 hover:text-blue-400 ${post.userVote === 'up' ? 'text-blue-400' : ''}`}
                  >
                    <span className="material-symbols-outlined">thumb_up</span>
                  </button>
                  <span className="font-bold text-gray-200">{post.likes}</span>
                   <button 
                    onClick={() => handleVote(post.id, 'down')}
                    className={`flex items-center gap-1 hover:text-red-400 ${post.userVote === 'down' ? 'text-red-400' : ''}`}
                  >
                    <span className="material-symbols-outlined">thumb_down</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleRestart}>
             <img src={CHINA_MENTOR_IMAGE} alt="ChinaMenTor Logo" className="w-10 h-10 object-contain" />
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
               ChinaMenTor
             </h1>
          </div>
          
          <nav className="flex gap-2 bg-gray-900 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'create' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Create
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'community' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Community
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8">
        {activeTab === 'create' ? renderCreateTab() : renderCommunityTab()}
      </main>
    </div>
  );
};

export default App;
