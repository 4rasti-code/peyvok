import React, { useState, useEffect, useCallback } from 'react';
import { motion as Motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { triggerHaptic } from '../utils/haptics';

const AdminPanelView = ({ onBack }) => {
 const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'bugs'

 // State for Message Reports
 const [msgReports, setMsgReports] = useState([]);
 const [replyTexts, setReplyTexts] = useState({});
 const [sendingId, setSendingId] = useState(null);

 // State for Bug Reports
 const [bugReports, setBugReports] = useState([]);

 const [loading, setLoading] = useState(true);

 const fetchMsgReports = useCallback(async () => {
 try {
 setLoading(true);
 const { data: reportsData, error: reportsError } = await supabase
 .from('reported_messages')
 .select('*')
 .eq('status', 'pending')
 .order('created_at', { ascending: false });

 if (reportsError) throw reportsError;

 if (!reportsData || reportsData.length === 0) {
 setMsgReports([]);
 return;
 }

 const messageIds = [...new Set(reportsData.map(r => r.message_id).filter(id => id))];

 let chatContentMap = {};
 let allUserIds = [...new Set(reportsData.map(r => r.reporter_id))];

 if (messageIds.length > 0) {
 // Fetch from messages
 const { data: messagesData } = await supabase
 .from('messages')
 .select('id, content, user_id')
 .in('id', messageIds);

 if (messagesData) {
 messagesData.forEach(c => {
 chatContentMap[c.id] = { id: c.id, content: c.content, sender_id: c.user_id };
 allUserIds.push(c.user_id);
 });
 }
 }

 const uniqueUserIds = [...new Set(allUserIds.filter(id => id))];

 const { data: profilesData } = await supabase
 .from('profiles')
 .select('id, nickname')
 .in('id', uniqueUserIds);

 const profileMap = {};
 if (profilesData) {
 profilesData.forEach(p => profileMap[p.id] = p);
 }

 const merged = reportsData.map(r => {
 const chatData = chatContentMap[r.message_id];
 return {
 ...r,
 profile: profileMap[r.reporter_id] || { nickname: 'نەناسراو' },
 reportedContent: chatData ? chatData.content : null,
 reportedUser: chatData ? (profileMap[chatData.sender_id] || { nickname: 'نەناسراو' }) : null
 };
 });

 setMsgReports(merged);
 } catch (err) {
 console.error("Error fetching msg reports:", err);
 } finally {
 setLoading(false);
 }
 }, []);

 const fetchBugReports = useCallback(async () => {
 try {
 setLoading(true);
 const { data: reportsData, error: reportsError } = await supabase
 .from('user_reports')
 .select('*')
 .eq('status', 'pending')
 .order('created_at', { ascending: false });

 if (reportsError) throw reportsError;

 if (!reportsData || reportsData.length === 0) {
 setBugReports([]);
 return;
 }

 const userIds = [...new Set(reportsData.map(r => r.user_id))];
 const { data: profilesData } = await supabase
 .from('profiles')
 .select('id, nickname')
 .in('id', userIds);

 const profileMap = {};
 if (profilesData) {
 profilesData.forEach(p => profileMap[p.id] = p);
 }

 const merged = reportsData.map(r => ({
 ...r,
 profile: profileMap[r.user_id] || { nickname: 'نەناسراو' }
 }));

 setBugReports(merged);
 } catch (err) {
 console.error("Error fetching bug reports:", err);
 } finally {
 setLoading(false);
 }
 }, []);

 const fetchData = useCallback(async () => {
 if (activeTab === 'messages') {
 await fetchMsgReports();
 } else {
 await fetchBugReports();
 }
 }, [activeTab, fetchMsgReports, fetchBugReports]);

 useEffect(() => {
 fetchData();
 }, [fetchData]);

 const handleReplyChange = (id, text) => {
 setReplyTexts(prev => ({ ...prev, [id]: text }));
 };

 const handleSendReply = async (report) => {
 const text = replyTexts[report.id];
 if (!text || !text.trim()) return;

 try {
 setSendingId(report.id);
 triggerHaptic(10);

 let imagesText = '';
 if (report.reportedImage) {
 imagesText = '\n\n' + report.reportedImage.split(',').map(url => `[IMAGE:${url.trim()}]`).join('');
 }

 // Send the message as the Bot
 const { error: msgError } = await supabase
 .from('messages')
 .insert([{
 content: `📌 ڕاپۆرتا نامەیێ:\n"${report.reportedContent}"${imagesText}\n\nبەرسڤ:\n${text.trim()}`,
 user_id: '9a813c24-b662-477d-a74a-6f822d17bbf1', // System Bot ID
 user_nickname: 'پەیڤۆک',
 receiver_id: report.reporter_id,
 is_read: false,
 reply_to_text: report.reportedContent ? report.reportedContent.substring(0, 150) + (report.reportedContent.length > 150 ? '...' : '') : ''
 }]);

 if (msgError) throw msgError;

 // Mark report as resolved
 const { error: resolveError } = await supabase
 .from('reported_messages')
 .update({ status: 'resolved' })
 .eq('id', report.id);

 if (resolveError) throw resolveError;

 setMsgReports(prev => prev.filter(r => r.id !== report.id));
 setReplyTexts(prev => ({ ...prev, [report.id]: '' }));

 } catch (err) {
 console.error("Error sending reply:", err);
 alert('هەڵە: ' + (err.message || JSON.stringify(err)));
 } finally {
 setSendingId(null);
 }
 };

 const handleMarkMsgResolved = async (reportId) => {
 try {
 triggerHaptic(10);
 const { error } = await supabase
 .from('reported_messages')
 .delete()
 .eq('id', reportId);

 if (error) throw error;
 setMsgReports(prev => prev.filter(r => r.id !== reportId));
 } catch (err) {
 console.error("Error marking resolved:", err);
 }
 };

 const handleMarkBugResolved = async (reportId) => {
 try {
 triggerHaptic(10);
 const report = bugReports.find(r => r.id === reportId);

 // 1. Delete associated images from storage
 if (report && report.image_url) {
 const urls = report.image_url.split(',');
 const fileNames = urls.map(url => {
 const parts = url.split('report_images/');
 return parts.length > 1 ? parts[1] : null;
 }).filter(Boolean);

 if (fileNames.length > 0) {
 await supabase.storage.from('report_images').remove(fileNames);
 }
 }

 // 2. Delete the report from the database
 const { error } = await supabase
 .from('user_reports')
 .delete()
 .eq('id', reportId);

 if (error) throw error;
 setBugReports(prev => prev.filter(r => r.id !== reportId));
 } catch (err) {
 console.error("Error deleting report:", err);
 }
 };

 const handleSendBugReply = async (report) => {
 const text = replyTexts[report.id];
 if (!text || !text.trim()) return;

 try {
 setSendingId(report.id);
 triggerHaptic(10);

 let imagesText = '';
 if (report.image_url) {
 imagesText = '\n\n' + report.image_url.split(',').map(url => `[IMAGE:${url.trim()}]`).join('');
 }

 const { error: msgError } = await supabase
 .from('messages')
 .insert([{
 content: `📌 ${report.type === 'bug' ? 'ئاریشە' : 'پێشنیار'}:\n"${report.description}"${imagesText}\n\nبەرسڤ:\n${text.trim()}`,
 user_id: '9a813c24-b662-477d-a74a-6f822d17bbf1', // System Bot ID
 user_nickname: 'پەیڤۆک',
 receiver_id: report.user_id,
 is_read: false,
 reply_to_text: report.description ? report.description.substring(0, 150) + (report.description.length > 150 ? '...' : '') : ''
 }]);

 if (msgError) throw msgError;

 await handleMarkBugResolved(report.id);
 
 setReplyTexts(prev => ({ ...prev, [report.id]: '' }));

 } catch (err) {
 console.error("Error sending reply:", err);
 alert('هەڵە: ' + (err.message || JSON.stringify(err)));
 } finally {
 setSendingId(null);
 }
 };

 return (
 <div className="absolute inset-0 z-50 bg-[#F9FAFB] dark:bg-[#121212] flex flex-col items-center select-none overflow-hidden" dir="rtl">
 {/* Header */}
 <div className="w-full h-14 bg-white dark:bg-[#1C1C1E] border-b border-mono-200 dark:border-white/10 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
 <div className="flex items-center gap-3">
 <button
 onClick={() => { triggerHaptic(10); onBack(); }}
 className="w-8 h-8 rounded-full bg-mono-100 dark:bg-white/10 flex items-center justify-center text-mono-700 dark:text-white/70 active:scale-95"
 >
 <span className="material-symbols-outlined">arrow_forward</span>
 </button>
 <h1 className="font-bold text-lg text-mono-900 dark:text-white">پەنێڵی ئەدمین (پەیڤۆک)</h1>
 </div>
 <button
 onClick={fetchData}
 className="w-8 h-8 flex items-center justify-center text-primary active:scale-95"
 >
 <span className="material-symbols-outlined text-xl">refresh</span>
 </button>
 </div>

 {/* Tabs */}
 <div className="w-full max-w-md mx-auto mt-4 px-4 shrink-0">
 <div className="flex bg-mono-200 dark:bg-white/5 rounded-lg p-1">
 <button
 onClick={() => setActiveTab('messages')}
 className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'messages' ? 'bg-white dark:bg-mono-700 text-mono-900 dark:text-white shadow-sm' : 'text-mono-500 hover:text-mono-700 dark:hover:text-mono-300'}`}
 >
 ڕاپۆرتێن نامەیان
 </button>
 <button
 onClick={() => setActiveTab('bugs')}
 className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'bugs' ? 'bg-white dark:bg-mono-700 text-mono-900 dark:text-white shadow-sm' : 'text-mono-500 hover:text-mono-700 dark:hover:text-mono-300'}`}
 >
 ئاریشە و پێشنیار
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 w-full max-w-md mx-auto overflow-y-auto p-4 flex flex-col gap-4">
 {loading ? (
 <div className="flex-1 flex items-center justify-center">
 <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
 </div>
 ) : activeTab === 'messages' ? (
 msgReports.length === 0 ? (
 <div className="flex-1 flex flex-col items-center justify-center text-mono-500 dark:text-mono-400">
 <span className="material-symbols-outlined text-6xl mb-2 opacity-50">done_all</span>
 <p className="font-bold">چ ڕاپۆرتێن نامەیان نینن</p>
 </div>
 ) : (
 msgReports.map(report => {
 const isBotMessage = report.reason?.startsWith('[نامەیا بۆتی]: ');
 const displayReason = isBotMessage ? report.reason.replace('[نامەیا بۆتی]: ', '') : report.reason;

 return (
 <Motion.div
 key={report.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-mono-200 dark:border-white/10 p-4 shadow-sm flex flex-col gap-3 w-full shrink-0 overflow-hidden relative"
 >
 <div className="flex items-start justify-between gap-2">
 <div>
 <h3 className="font-bold text-primary flex items-center gap-1 text-sm">
 <span className="material-symbols-outlined text-base">account_circle</span>
 {report.profile?.nickname}
 </h3>
 <div className="text-xs text-mono-400 mt-1" dir="ltr">
 {new Date(report.created_at).toLocaleString('en-GB')}
 </div>
 </div>
 <div className="flex items-center gap-1">
 {isBotMessage ? (
 <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded font-bold">
 نامە بۆ بۆت
 </span>
 ) : (
 <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-2 py-0.5 rounded font-bold">
 ڕاپۆرت
 </span>
 )}
 </div>
 </div>

 <div className="bg-mono-50 dark:bg-black/20 p-3.5 rounded-xl text-sm text-mono-800 dark:text-mono-200 border border-mono-100 dark:border-white/5 whitespace-pre-wrap leading-relaxed shadow-inner">
 {report.reportedContent ? (
 <div className="flex flex-col gap-2">
 <div className="bg-white dark:bg-[#2C2C2E] p-3 rounded-lg border border-mono-200 dark:border-white/10 shadow-sm relative">
 <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-md">دەقێ سکاڵا لێکری</span>
 <div className="font-bold text-primary mb-1 text-xs">{report.reportedUser?.nickname}:</div>
 <div className="text-mono-900 dark:text-mono-100">{report.reportedContent}</div>
 </div>
 {displayReason && displayReason !== 'بێ هۆکار' && (
 <div className="mt-1 text-xs text-mono-500 flex items-start gap-1 bg-mono-100 dark:bg-black/30 p-2 rounded-md">
 <span className="material-symbols-outlined text-[14px]">info</span>
 <span>هۆکار: {displayReason}</span>
 </div>
 )}
 </div>
 ) : (
 <div className="text-mono-500 italic">
 {displayReason || 'بێ هۆکار'}
 </div>
 )}
 </div>

 <div className="flex flex-col gap-2 mt-2">
 <textarea
 value={replyTexts[report.id] || ''}
 onChange={(e) => handleReplyChange(report.id, e.target.value)}
 placeholder="وەڵامەکەت لێرە بنووسە..."
 className="w-full bg-mono-100 dark:bg-black/30 border border-mono-200 dark:border-white/10 rounded-xl p-3.5 text-sm min-h-30 focus:outline-none focus:border-primary/50 focus:bg-white dark:focus:bg-[#2C2C2E] transition-all resize-y shadow-inner"
 />
 <div className="flex gap-2 justify-end">
 <button
 onClick={() => handleMarkMsgResolved(report.id)}
 className="px-4 py-2 rounded-lg text-sm font-bold text-mono-500 bg-mono-100 dark:bg-white/5 active:scale-95"
 >
 سڕینەوە
 </button>
 <button
 onClick={() => handleSendReply(report)}
 disabled={sendingId === report.id || !replyTexts[report.id]?.trim()}
 className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-primary disabled:opacity-50 active:scale-95 flex items-center gap-2"
 >
 {sendingId === report.id ? (
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
 ) : (
 <span className="material-symbols-outlined text-lg">send</span>
 )}
 ناردن
 </button>
 </div>
 </div>
 </Motion.div>
 );
 })
 )
 ) : (
 bugReports.length === 0 ? (
 <div className="flex-1 flex flex-col items-center justify-center text-mono-500 dark:text-mono-400">
 <span className="material-symbols-outlined text-6xl mb-2 opacity-50">done_all</span>
 <p className="font-bold">چ ئاریشە یان پێشنیار نینن</p>
 </div>
 ) : (
 bugReports.map(report => (
 <Motion.div
 key={report.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-mono-200 dark:border-white/10 p-4 shadow-sm flex flex-col gap-3 w-full shrink-0 overflow-hidden relative"
 >
 <div className="flex items-start justify-between gap-2">
 <div>
 <h3 className="font-bold text-primary flex items-center gap-1 text-sm">
 <span className="material-symbols-outlined text-base">account_circle</span>
 {report.profile?.nickname}
 </h3>
 <div className="text-xs text-mono-400 mt-1" dir="ltr">
 {new Date(report.created_at).toLocaleString('en-GB')}
 </div>
 </div>
 <div className="flex items-center gap-1">
 {report.type === 'bug' ? (
 <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-2 py-0.5 rounded font-bold">
 ئاریشە
 </span>
 ) : (
 <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded font-bold">
 پێشنیار
 </span>
 )}
 </div>
 </div>

 <div className="bg-mono-50 dark:bg-black/20 p-3.5 rounded-xl text-sm text-mono-800 dark:text-mono-200 border border-mono-100 dark:border-white/5 whitespace-pre-wrap leading-relaxed shadow-inner">
 {report.description}
 </div>

 {report.image_url && (
 <div className="flex gap-3 overflow-x-auto pb-2 mt-2 snap-x hide-scrollbar w-full">
 {report.image_url.split(',').map((url, i) => (
 <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 relative group snap-start transition-all">
 <img src={url} alt={`Screenshot ${i + 1}`} className="h-48 sm:h-64 w-auto object-contain rounded-xl border border-mono-200 dark:border-white/10 bg-mono-100 dark:bg-black/40 shadow-sm" />
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-xl pointer-events-none">
 <span className="material-symbols-outlined text-3xl drop-shadow-md">zoom_in</span>
 </div>
 </a>
 ))}
 </div>
 )}

 <div className="flex flex-col gap-2 mt-2 border-t border-mono-100 dark:border-white/5 pt-3">
 <textarea
 value={replyTexts[report.id] || ''}
 onChange={(e) => handleReplyChange(report.id, e.target.value)}
 placeholder="وەڵامەکەت لێرە بنووسە... (ڤێرژنا نوی)"
 className="w-full bg-mono-100 dark:bg-black/30 border border-mono-200 dark:border-white/10 rounded-xl p-3.5 text-sm min-h-30 focus:outline-none focus:border-primary/50 focus:bg-white dark:focus:bg-[#2C2C2E] transition-all resize-y shadow-inner"
 />
 <div className="flex justify-end gap-2">
 <button
 onClick={() => handleMarkBugResolved(report.id)}
 className="px-4 py-2 rounded-lg text-sm font-bold text-mono-500 bg-mono-100 dark:bg-white/5 active:scale-95"
 >
 سڕینەوە
 </button>
 <button
 onClick={() => handleSendBugReply(report)}
 disabled={sendingId === report.id || !replyTexts[report.id]?.trim()}
 className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-primary disabled:opacity-50 active:scale-95 flex items-center gap-2"
 >
 {sendingId === report.id ? (
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
 ) : (
 <span className="material-symbols-outlined text-lg">send</span>
 )}
 ناردن
 </button>
 </div>
 </div>
 </Motion.div>
 ))
 )
 )}
 </div>
 </div>
 );
};

export default AdminPanelView;
