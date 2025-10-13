Here's the result of running `cat -n` on /home/ubuntu/github_repos/the-writers-corner/app/components/community/community-overview.tsx:
     1	
     2	'use client'
     3	
     4	import { useState, useEffect } from 'react'
     5	import { motion, AnimatePresence } from 'framer-motion'
     6	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
     7	import { Button } from '@/components/ui/button'
     8	import { Badge } from '@/components/ui/badge'
     9	import { Users, PenTool, BookOpen, Heart, MessageCircle, Filter, Search, Send, X } from 'lucide-react'
    10	import { Input } from '@/components/ui/input'
    11	import { Textarea } from '@/components/ui/textarea'
    12	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
    13	import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
    14	import Link from 'next/link'
    15	import { toast } from 'react-hot-toast'
    16	
    17	interface CommunityPost {
    18	  id: string
    19	  title: string
    20	  content: string
    21	  createdAt: string
    22	  likesCount: number
    23	  commentsCount: number
    24	  isLikedByUser: boolean
    25	  user: {
    26	    firstName?: string
    27	    lastName?: string
    28	    name?: string
    29	  }
    30	  exercise?: {
    31	    title: string
    32	    topic: {
    33	      title: string
    34	      slug: string
    35	    }
    36	  }
    37	  likeCount?: number
    38	  commentCount?: number
    39	}
    40	
    41	interface Comment {
    42	  id: string
    43	  content: string
    44	  createdAt: string
    45	  user: {
    46	    id: string
    47	    firstName?: string
    48	    lastName?: string
    49	    name?: string
    50	  }
    51	}
    52	
    53	export function CommunityOverview() {
    54	  const [posts, setPosts] = useState<CommunityPost[]>([])
    55	  const [loading, setLoading] = useState(true)
    56	  const [searchTerm, setSearchTerm] = useState('')
    57	  const [topicFilter, setTopicFilter] = useState('all')
    58	  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
    59	  const [comments, setComments] = useState<Record<string, Comment[]>>({})
    60	  const [newComment, setNewComment] = useState<Record<string, string>>({})
    61	  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
    62	  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({})
    63	
    64	
    65	  useEffect(() => {
    66	    fetchCommunityPosts()
    67	  }, [])
    68	
    69	  const fetchCommunityPosts = async () => {
    70	    try {
    71	      const response = await fetch('/api/community/posts')
    72	      if (response.ok) {
    73	        const data = await response.json()
    74	        setPosts(data.posts || [])
    75	      }
    76	    } catch (error) {
    77	      console.error('Error fetching community posts:', error)
    78	      toast.error('Failed to load posts')
    79	    } finally {
    80	      setLoading(false)
    81	    }
    82	  }
    83	
    84	  const handleLike = async (postId: string) => {
    85	    try {
    86	      const response = await fetch(`/api/community/posts/${postId}/like`, {
    87	        method: 'POST'
    88	      })
    89	
    90	      if (response.ok) {
    91	        const data = await response.json()
    92	        
    93	        // Update the post in the local state
    94	        setPosts(prevPosts => 
    95	          prevPosts.map(post => 
    96	            post.id === postId 
    97	              ? {
    98	                  ...post,
    99	                  isLikedByUser: data.liked,
   100	                  likesCount: data.liked ? post.likesCount + 1 : post.likesCount - 1
   101	                }
   102	              : post
   103	          )
   104	        )
   105	      }
   106	    } catch (error) {
   107	      console.error('Error toggling like:', error)
   108	    }
   109	  }
   110	
   111	  const fetchComments = async (postId: string) => {
   112	    if (comments[postId]) {
   113	      // Already loaded, just toggle visibility
   114	      setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }))
   115	      return
   116	    }
   117	
   118	    setLoadingComments(prev => ({ ...prev, [postId]: true }))
   119	    
   120	    try {
   121	      const response = await fetch(`/api/community/posts/${postId}/comments`)
   122	      if (response.ok) {
   123	        const data = await response.json()
   124	        setComments(prev => ({ ...prev, [postId]: data.comments || [] }))
   125	        setExpandedComments(prev => ({ ...prev, [postId]: true }))
   126	      }
   127	    } catch (error) {
   128	      console.error('Error fetching comments:', error)
   129	    } finally {
   130	      setLoadingComments(prev => ({ ...prev, [postId]: false }))
   131	    }
   132	  }
   133	
   134	  const handleAddComment = async (postId: string) => {
   135	    const content = newComment[postId]?.trim()
   136	    
   137	    if (!content) return
   138	
   139	    setSubmittingComment(prev => ({ ...prev, [postId]: true }))
   140	
   141	    try {
   142	      const response = await fetch(`/api/community/posts/${postId}/comments`, {
   143	        method: 'POST',
   144	        headers: {
   145	          'Content-Type': 'application/json'
   146	        },
   147	        body: JSON.stringify({ content })
   148	      })
   149	
   150	      if (response.ok) {
   151	        const data = await response.json()
   152	        
   153	        // Add the new comment to the list
   154	        setComments(prev => ({
   155	          ...prev,
   156	          [postId]: [...(prev[postId] || []), data.comment]
   157	        }))
   158	
   159	        // Update comment count in post
   160	        setPosts(prevPosts => 
   161	          prevPosts.map(post => 
   162	            post.id === postId 
   163	              ? { ...post, commentsCount: post.commentsCount + 1 }
   164	              : post
   165	          )
   166	        )
   167	
   168	        // Clear the input
   169	        setNewComment(prev => ({ ...prev, [postId]: '' }))
   170	      }
   171	    } catch (error) {
   172	      console.error('Error adding comment:', error)
   173	    } finally {
   174	      setSubmittingComment(prev => ({ ...prev, [postId]: false }))
   175	    }
   176	  }
   177	
   178	  const filteredPosts = posts.filter(post => {
   179	    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
   180	                         post.content.toLowerCase().includes(searchTerm.toLowerCase())
   181	    const matchesTopic = topicFilter === 'all' || post.exercise?.topic.slug === topicFilter
   182	    return matchesSearch && matchesTopic
   183	  })
   184	
   185	  const getExcerpt = (content: string, maxLength: number = 200) => {
   186	    if (content.length <= maxLength) return content
   187	    return content.substring(0, maxLength) + '...'
   188	  }
   189	
   190	  const formatDate = (dateString: string) => {
   191	    return new Date(dateString).toLocaleDateString('en-US', {
   192	      month: 'short',
   193	      day: 'numeric',
   194	      year: 'numeric'
   195	    })
   196	  }
   197	
   198	  const formatCommentDate = (dateString: string) => {
   199	    const date = new Date(dateString)
   200	    const now = new Date()
   201	    const diff = now.getTime() - date.getTime()
   202	    const minutes = Math.floor(diff / 60000)
   203	    const hours = Math.floor(diff / 3600000)
   204	    const days = Math.floor(diff / 86400000)
   205	
   206	    if (minutes < 1) return 'just now'
   207	    if (minutes < 60) return `${minutes}m ago`
   208	    if (hours < 24) return `${hours}h ago`
   209	    if (days < 7) return `${days}d ago`
   210	    return formatDate(dateString)
   211	  }
   212	
   213	  if (loading) {
   214	    return (
   215	      <section className="py-12 px-4 paper-texture min-h-screen">
   216	        <div className="max-w-content mx-auto text-center">
   217	          <div className="animate-pulse">
   218	            <div className="h-8 bg-sepia rounded w-1/2 mx-auto mb-4"></div>
   219	            <div className="h-4 bg-sepia rounded w-1/3 mx-auto"></div>
   220	          </div>
   221	        </div>
   222	      </section>
   223	    )
   224	  }
   225	
   226	  return (
   227	    <section className="py-12 px-4 paper-texture min-h-screen">
   228	      <div className="max-w-content mx-auto">
   229	        {/* Header */}
   230	        <motion.div
   231	          initial={{ opacity: 0, y: 30 }}
   232	          animate={{ opacity: 1, y: 0 }}
   233	          transition={{ duration: 0.8 }}
   234	          className="text-center mb-12"
   235	        >
   236	          <h1 className="text-4xl md:text-5xl font-typewriter font-bold text-ink mb-6">
   237	            Writer's Community
   238	          </h1>
   239	          <p className="text-xl font-serif text-forest max-w-3xl mx-auto leading-relaxed mb-8">
   240	            Connect with fellow writers, share your exercise responses, and discover inspiration 
   241	            from the creative work of others in our supportive community.
   242	          </p>
   243	
   244	          {/* Stats */}
   245	          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
   246	            <div className="text-center">
   247	              <div className="text-3xl font-typewriter font-bold text-rust mb-1">
   248	                {posts.length}
   249	              </div>
   250	              <p className="font-serif text-forest text-sm">Shared Works</p>
   251	            </div>
   252	            <div className="text-center">
   253	              <div className="text-3xl font-typewriter font-bold text-rust mb-1">
   254	                {new Set(posts.map(p => p.user?.name || `${p.user?.firstName} ${p.user?.lastName}`)).size}
   255	              </div>
   256	              <p className="font-serif text-forest text-sm">Active Writers</p>
   257	            </div>
   258	            <div className="text-center">
   259	              <div className="text-3xl font-typewriter font-bold text-rust mb-1">
   260	                4
   261	              </div>
   262	              <p className="font-serif text-forest text-sm">Topics</p>
   263	            </div>
   264	          </div>
   265	        </motion.div>
   266	
   267	        {/* Filters */}
   268	        <motion.div
   269	          initial={{ opacity: 0, y: 20 }}
   270	          animate={{ opacity: 1, y: 0 }}
   271	          transition={{ duration: 0.6, delay: 0.2 }}
   272	          className="mb-8"
   273	        >
   274	          <Card className="card-vintage border-2">
   275	            <CardHeader>
   276	              <CardTitle className="font-typewriter text-ink flex items-center gap-2">
   277	                <Filter className="w-5 h-5" />
   278	                Find Writing
   279	              </CardTitle>
   280	            </CardHeader>
   281	            <CardContent>
   282	              <div className="grid md:grid-cols-2 gap-4">
   283	                <div>
   284	                  <label className="font-typewriter text-ink block mb-2">Search:</label>
   285	                  <div className="relative">
   286	                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-forest" />
   287	                    <Input
   288	                      placeholder="Search posts..."
   289	                      value={searchTerm}
   290	                      onChange={(e) => setSearchTerm(e.target.value)}
   291	                      className="pl-10 font-serif border-2 border-ink focus:border-rust"
   292	                    />
   293	                  </div>
   294	                </div>
   295	                <div>
   296	                  <label className="font-typewriter text-ink block mb-2">Topic:</label>
   297	                  <Select value={topicFilter} onValueChange={setTopicFilter}>
   298	                    <SelectTrigger className="font-serif border-2 border-ink focus:border-rust">
   299	                      <SelectValue placeholder="All Topics" />
   300	                    </SelectTrigger>
   301	                    <SelectContent>
   302	                      <SelectItem value="all">All Topics</SelectItem>
   303	                      <SelectItem value="character-development">Character Development</SelectItem>
   304	                      <SelectItem value="plot-structure">Plot Structure</SelectItem>
   305	                      <SelectItem value="world-building">World-Building</SelectItem>
   306	                      <SelectItem value="writing-tension">Writing Tension</SelectItem>
   307	                    </SelectContent>
   308	                  </Select>
   309	                </div>
   310	              </div>
   311	            </CardContent>
   312	          </Card>
   313	        </motion.div>
   314	
   315	        {/* Posts */}
   316	        {filteredPosts.length === 0 ? (
   317	          <motion.div
   318	            initial={{ opacity: 0, y: 20 }}
   319	            animate={{ opacity: 1, y: 0 }}
   320	            transition={{ duration: 0.6, delay: 0.3 }}
   321	            className="text-center py-16"
   322	          >
   323	            <PenTool className="w-16 h-16 text-forest mx-auto mb-4" />
   324	            <h3 className="text-2xl font-typewriter font-bold text-ink mb-4">
   325	              {searchTerm || topicFilter !== 'all' ? 'No matches found' : 'No shared work yet'}
   326	            </h3>
   327	            <p className="font-serif text-forest mb-6 max-w-md mx-auto">
   328	              {searchTerm || topicFilter !== 'all' 
   329	                ? 'Try adjusting your search terms or filters.'
   330	                : 'Be the first to share your exercise responses with the community! Complete exercises and make them public to start building our creative library.'
   331	              }
   332	            </p>
   333	            {!searchTerm && topicFilter === 'all' && (
   334	              <Link href="/topics">
   335	                <Button className="btn-vintage">
   336	                  Start Writing Exercises
   337	                </Button>
   338	              </Link>
   339	            )}
   340	          </motion.div>
   341	        ) : (
   342	          <div className="space-y-6">
   343	            {filteredPosts.map((post, index) => (
   344	              <motion.div
   345	                key={post.id}
   346	                initial={{ opacity: 0, y: 30 }}
   347	                animate={{ opacity: 1, y: 0 }}
   348	                transition={{ duration: 0.6, delay: index * 0.1 }}
   349	              >
   350	                <Card className="card-vintage border-2 hover:shadow-xl transition-all duration-300">
   351	                  <CardHeader>
   352	                    <div className="flex items-start justify-between">
   353	                      <div className="flex-1">
   354	                        <CardTitle className="font-typewriter text-ink text-xl mb-2">
   355	                          {post.title || 'Exercise Response'}
   356	                        </CardTitle>
   357	                        <div className="flex items-center gap-3 mb-3">
   358	                          <Badge className="bg-rust/20 text-rust font-typewriter">
   359	                            {post.user?.firstName && post.user?.lastName 
   360	                              ? `${post.user.firstName} ${post.user.lastName}`
   361	                              : post.user?.name || 'Anonymous Writer'
   362	                            }
   363	                          </Badge>
   364	                          {post.exercise && (
   365	                            <Badge className="bg-gold/20 text-ink font-typewriter">
   366	                              {post.exercise.topic.title}
   367	                            </Badge>
   368	                          )}
   369	                          <span className="text-sm font-serif text-forest">
   370	                            {formatDate(post.createdAt)}
   371	                          </span>
   372	                        </div>
   373	                        {post.exercise && (
   374	                          <p className="text-sm font-serif text-forest mb-2">
   375	                            From exercise: <span className="font-semibold">{post.exercise.title}</span>
   376	                          </p>
   377	                        )}
   378	                      </div>
   379	                    </div>
   380	                  </CardHeader>
   381	                  <CardContent>
   382	                    <p className="font-serif text-forest leading-relaxed mb-4">
   383	                      {getExcerpt(post.content)}
   384	                    </p>
   385	                    
   386	                    <div className="flex items-center justify-between">
   387	                      <div className="flex items-center gap-4">
   388	                        <Button 
   389	                          variant="ghost" 
   390	                          size="sm" 
   391	                          className={`text-forest hover:text-rust ${post.isLikedByUser ? 'text-rust' : ''}`}
   392	                          onClick={() => handleLike(post.id)}
   393	                        >
   394	                          <Heart 
   395	                            className={`w-4 h-4 mr-1 ${post.isLikedByUser ? 'fill-rust' : ''}`}
   396	                          />
   397	                          {post.likesCount > 0 ? post.likesCount : 'Like'}
   398	                        </Button>
   399	                        <Button 
   400	                          variant="ghost" 
   401	                          size="sm" 
   402	                          className="text-forest hover:text-rust"
   403	                          onClick={() => fetchComments(post.id)}
   404	                        >
   405	                          <MessageCircle className="w-4 h-4 mr-1" />
   406	                          {post.commentsCount > 0 ? post.commentsCount : 'Comment'}
   407	                        </Button>
   408	                      </div>
   409	                      
   410	                      {post.exercise && (
   411	                        <Link href={`/topics/${post.exercise.topic.slug}`}>
   412	                          <Button variant="outline" size="sm" className="btn-vintage text-xs">
   413	                            Try This Exercise
   414	                          </Button>
   415	                        </Link>
   416	                      )}
   417	                    </div>
   418	
   419	                    {/* Comments Section */}
   420	                    {expandedComments[post.id] && (
   421	                      <div className="mt-4 pt-4 border-t-2 border-sepia">
   422	                        <h4 className="font-typewriter font-bold text-ink mb-3">
   423	                          Comments ({post.commentsCount})
   424	                        </h4>
   425	                        
   426	                        {/* Comment Input */}
   427	                        <div className="mb-4">
   428	                          <div className="flex gap-2">
   429	                            <Input
   430	                              placeholder="Add a comment..."
   431	                              value={newComment[post.id] || ''}
   432	                              onChange={(e) => setNewComment(prev => ({ 
   433	                                ...prev, 
   434	                                [post.id]: e.target.value 
   435	                              }))}
   436	                              className="font-serif border-2 border-ink focus:border-rust"
   437	                              onKeyDown={(e) => {
   438	                                if (e.key === 'Enter' && !e.shiftKey) {
   439	                                  e.preventDefault()
   440	                                  handleAddComment(post.id)
   441	                                }
   442	                              }}
   443	                            />
   444	                            <Button
   445	                              onClick={() => handleAddComment(post.id)}
   446	                              disabled={!newComment[post.id]?.trim() || submittingComment[post.id]}
   447	                              className="btn-vintage"
   448	                            >
   449	                              {submittingComment[post.id] ? 'Posting...' : 'Post'}
   450	                            </Button>
   451	                          </div>
   452	                        </div>
   453	
   454	                        {/* Comments List */}
   455	                        {loadingComments[post.id] ? (
   456	                          <div className="text-center py-4 text-forest font-serif">
   457	                            Loading comments...
   458	                          </div>
   459	                        ) : (
   460	                          <div className="space-y-3">
   461	                            {comments[post.id]?.length === 0 ? (
   462	                              <p className="text-forest font-serif text-sm text-center py-4">
   463	                                No comments yet. Be the first to comment!
   464	                              </p>
   465	                            ) : (
   466	                              comments[post.id]?.map((comment) => (
   467	                                <div 
   468	                                  key={comment.id} 
   469	                                  className="bg-sepia/30 p-3 rounded-sm border border-ink/20"
   470	                                >
   471	                                  <div className="flex items-start justify-between mb-2">
   472	                                    <span className="font-typewriter text-ink font-semibold text-sm">
   473	                                      {comment.user.firstName && comment.user.lastName 
   474	                                        ? `${comment.user.firstName} ${comment.user.lastName}`
   475	                                        : comment.user.name || 'Anonymous'
   476	                                      }
   477	                                    </span>
   478	                                    <span className="text-xs font-serif text-forest">
   479	                                      {formatCommentDate(comment.createdAt)}
   480	                                    </span>
   481	                                  </div>
   482	                                  <p className="font-serif text-forest text-sm">
   483	                                    {comment.content}
   484	                                  </p>
   485	                                </div>
   486	                              ))
   487	                            )}
   488	                          </div>
   489	                        )}
   490	                      </div>
   491	                    )}
   492	                  </CardContent>
   493	                </Card>
   494	              </motion.div>
   495	            ))}
   496	          </div>
   497	        )}
   498	
   499	        {/* Call to Action */}
   500	        <motion.div
   501	          initial={{ opacity: 0, y: 30 }}
   502	          animate={{ opacity: 1, y: 0 }}
   503	          transition={{ duration: 0.8, delay: 0.6 }}
   504	          className="text-center mt-16 p-8 bg-sepia/50 rounded-sm border-2 border-ink"
   505	        >
   506	          <h3 className="text-2xl font-typewriter font-bold text-ink mb-4">
   507	            Share Your Creative Work
   508	          </h3>
   509	          <p className="font-serif text-forest mb-6 max-w-2xl mx-auto">
   510	            When you complete writing exercises, you can choose to share them with the community. 
   511	            Your work might inspire another writer or receive helpful feedback!
   512	          </p>
   513	          <Link href="/topics">
   514	            <Button className="btn-vintage">
   515	              Start Writing
   516	            </Button>
   517	          </Link>
   518	        </motion.div>
   519	      </div>
   617	    </section>
   618	  )
   619	}
   620	