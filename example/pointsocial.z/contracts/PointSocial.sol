// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Counters.sol";


contract PointSocial {
    using Counters for Counters.Counter;
    Counters.Counter internal _postIds;
    Counters.Counter internal _commentIds;
    Counters.Counter internal _likeIds;

    struct Post {
        uint256 id;
        address from;
        bytes32 contents;
        bytes32 image;
        uint256 createdAt;
        uint16 likesCount;
        uint16 commentsCount;
    }

    struct Comment {
        uint256 id;
        address from;
        bytes32 contents;
        uint256 createdAt;
    }

    struct Like {
        uint256 id;
        address from;
        uint256 createdAt;
    }

    Post[] public posts;
    mapping(address => Post[]) public postsByOwner;
    mapping(uint256 => Post) public postById;
    mapping(uint256 => Comment[]) public commentsByPost;
    mapping(uint256 => Comment) public commentById;
    mapping(address => Comment[]) public commentsByOwner;
    mapping(uint256 => Like[]) public likesByPost;
    address private _owner;
    address private _migrator;

    constructor() {
        _owner = msg.sender;
    }

    function addMigrator(address migrator) public {
        require(msg.sender == _owner, "Access Denied");
        require(_migrator == address(0), "Access Denied");
        _migrator = migrator;
    }

    // Post data functions
    function addPost(bytes32 contents, bytes32 image) public {
        _postIds.increment();
        uint256 newPostId = _postIds.current();
        Post memory _post = Post(
            newPostId,
            msg.sender,
            contents,
            image,
            block.timestamp,
            0,
            0
        );
        posts.push(_post);
        postById[newPostId] = _post;
        postsByOwner[msg.sender].push(_post);
    }

    function getAllPosts() public view returns (Post[] memory) {
        Post[] memory _posts = new Post[](posts.length);
        for (uint256 i = 0; i < posts.length; i++) {
            _posts[i] = postById[posts[i].id];
        }
        return _posts;
    }

    function getAllPostsLength() public view returns (uint256) {
        return posts.length;
    }


    function getPaginatedPosts(uint256 cursor, uint256 howMany) public view returns (Post[] memory) {
        uint256 length = howMany;
        if(length > posts.length - cursor) {
            length = posts.length - cursor;
        }

        Post[] memory _posts = new Post[](length);
        for (uint256 i = length; i > 0; i--) {
            _posts[length-i] = postById[posts[posts.length - cursor - i].id];
        }
        return _posts;
    }

    function getAllPostsByOwner(address owner)
        public
        view
        returns (Post[] memory)
    {
        Post[] memory _posts = new Post[](postsByOwner[owner].length);
        for (uint256 i = 0; i < postsByOwner[owner].length; i++) {
            _posts[i] = postById[postsByOwner[owner][i].id];
        }
        return _posts;
    }

    function getAllPostsByOwnerLength(address owner) public view returns (uint256) {
        return postsByOwner[owner].length;
    }

    function getPaginatedPostsByOwner(address owner, uint256 cursor, uint256 howMany)
    public view returns (Post[] memory) {
        uint256 _ownerPostLength = postsByOwner[owner].length;

        uint256 length = howMany;
        if(length > _ownerPostLength - cursor) {
            length = _ownerPostLength - cursor;
        }

        Post[] memory _posts = new Post[](length);
        for (uint256 i = length; i > 0; i--) {
            _posts[length-i] = postById[postsByOwner[owner][_ownerPostLength - cursor - i].id];
        }
        return _posts;
    }

    function getPostById(uint256 id) public view returns (Post memory) {
        return postById[id];
    }

    // Example: 1,"0x0000000000000000000000000000000000000000000068692066726f6d20706e"
    function addCommentToPost(uint256 postId, bytes32 contents) public {
        _commentIds.increment();
        uint256 newCommentId = _commentIds.current();
        Comment memory _comment = Comment(
            newCommentId,
            msg.sender,
            contents,
            block.timestamp
        );
        commentsByPost[postId].push(_comment);
        commentById[newCommentId] = _comment;
        commentsByOwner[msg.sender].push(_comment);
        postById[postId].commentsCount += 1;
    }

    function getAllCommentsForPost(uint256 postId) public view returns (Comment[] memory)
    {
        return commentsByPost[postId];
    }

    // Likes data functions
    function addLikeToPost(uint256 postId) public returns(bool) {
        // Get the post and likes for the postId from the mapping
        Like[] storage _likesOnPost = likesByPost[postId];
        Post storage _post = postById[postId];

        uint256 _removeIndex;
        bool _isLiked = false;

        // Check if msg.sender has already liked
        for (uint256 i = 0; i < _likesOnPost.length; i++) {
            if(_likesOnPost[i].from == msg.sender) {
                _isLiked = true;
                _removeIndex = i;
                break;
            }
        }
        // If yes, then we remove that like and decrement the likesCount for the post
        if(_isLiked) {
            for (uint256 i = _removeIndex; i < _likesOnPost.length - 1; i++) {
                _likesOnPost[i] = _likesOnPost[i+1];
            }
            _likesOnPost.pop();
            _post.likesCount--;
            return false;
        }

        _likeIds.increment();
        uint256 newLikeId = _likeIds.current();
        Like memory _like = Like(newLikeId, msg.sender, block.timestamp);
        _likesOnPost.push(_like);
        postById[postId].likesCount += 1;
        return true;
    }

    function add(
        uint256 id,
        address author,
        bytes32 contents,
        bytes32 image,
        uint16 likesCount,
        uint256 createdAt
    ) public {
        require(msg.sender == _migrator, "Access Denied");

            Post memory _post = Post({
                id: id,
                from: author,
                contents: contents,
                image: image,
                createdAt: createdAt,
                likesCount: likesCount,
                commentsCount: 0
            });

            posts.push(_post);
            postsByOwner[_post.from].push(_post);
            postById[_post.id] = _post;
            _postIds.increment();
    }

    function addComment(
        uint256 id,
        uint256 postId,
        address author,
        bytes32 contents,
        uint256 createdAt
    ) public {
        require(msg.sender == _migrator, "Access Denied");

            Comment memory _comment = Comment({
                id: id,
                from: author,
                contents: contents,
                createdAt: createdAt
            });

            commentsByPost[postId].push(_comment);
            commentById[_comment.id] = _comment;
            commentsByOwner[_comment.from].push(_comment);
            _commentIds.increment();
            postById[postId].commentsCount += 1;
    }
}
