import { supabase } from '../lib/supabase';

// ==========================================
// USER & PROGRESSION
// ==========================================
export const syncProgressToSupabase = async (userId, updates) => {
  if (!userId) return { error: 'No user ID provided' };
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  return { data, error };
};

export const fetchUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const fetchLeaderboard = async (limit = 100) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, level, xp, city, country_code, is_kurdistan, fils, derhem, dinar, daily_streak')
    .order('level', { ascending: false })
    .order('xp', { ascending: false })
    .limit(limit);
  return { data, error };
};

// ==========================================
// GLOBAL CHAT
// ==========================================
export const fetchGlobalMessages = async (limit = 50) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .is('receiver_id', null) // Only global messages
    .order('created_at', { ascending: true })
    .limit(limit);
  return { data, error };
};

export const sendGlobalMessage = async (userId, nickname, content) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ 
      content, 
      user_id: userId, 
      user_nickname: nickname || 'یاریکەر',
      receiver_id: null // Explicitly global
    }]);
  return { data, error };
};

export const subscribeToGlobalChat = (callback) => {
  return supabase
    .channel('public:messages:global')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages',
      filter: 'receiver_id=is.null'
    }, callback)
    .subscribe();
};

export const unsubscribeFromChannel = (channel) => {
  supabase.removeChannel(channel);
};

// ==========================================
// PRIVATE CHAT
// ==========================================
export const fetchPrivateConversations = async (userId) => {
  // Fetch all message partners from the unified messages table
  const { data: sent } = await supabase.from('messages').select('receiver_id').eq('user_id', userId).not('receiver_id', 'is', null);
  const { data: received } = await supabase.from('messages').select('user_id').eq('receiver_id', userId);
  
  const partnerIds = [...new Set([
    ...(sent || []).map(m => m.receiver_id), 
    ...(received || []).map(m => m.user_id)
  ])];
  
  if (partnerIds.length === 0) return { data: [], error: null };
  
  const { data: profiles, error } = await supabase.from('profiles').select('id, nickname, avatar_url').in('id', partnerIds);
  return { data: profiles, error };
};

export const fetchPrivateChatHistory = async (userId, partnerId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(user_id.eq.${userId},receiver_id.eq.${partnerId}),and(user_id.eq.${partnerId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true });
  return { data, error };
};

export const sendPrivateMessage = async (senderId, recipientId, content) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ 
      content, 
      user_id: senderId, 
      receiver_id: recipientId,
      is_read: false
    }]);
  return { data, error };
};

export const subscribeToPrivateChat = (userId, partnerId, callback) => {
  return supabase
    .channel(`chat:${userId}:${partnerId}`)
    .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${userId}`
    }, callback)
    .subscribe();
};

// ==========================================
// FRIENDSHIPS
// ==========================================
export const fetchFriendsData = async (userId) => {
  // Fetch pending
  const { data: pending } = await supabase
    .from('friendships')
    .select('*, sender:user_id(id, nickname, avatar_url, country_code, is_kurdistan)')
    .eq('friend_id', userId)
    .eq('status', 'pending');
  
  // Fetch mutuals
  const { data: mutuals } = await supabase
    .from('friendships')
    .select('*, user:user_id(id, nickname, avatar_url), friend:friend_id(id, nickname, avatar_url)')
    .eq('status', 'accepted')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  return { pending: pending || [], mutuals: mutuals || [] };
};

export const acceptFriendRequest = async (requestId) => {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId);
  return { data, error };
};

export const sendFriendRequest = async (userId, targetUserId) => {
  const { data, error } = await supabase
    .from('friendships')
    .insert([{ user_id: userId, friend_id: targetUserId, status: 'pending' }]);
  return { data, error };
};
