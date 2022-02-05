//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract Poll {

    event EndPoll(Candidate[]);

    modifier restricted() {
        require(msg.sender == owner, "This function is restricted to the contract's owner");
        _;
    }

    struct Candidate {
        string name;
        uint votes;
    }
    address owner = msg.sender;
    bool pollStarted = false;
    Candidate[] candidates;

    function vote(string memory _candidate) public {
        require(pollStarted, "No poll happening at the moment!");
        for (uint i=0; i<candidates.length; i++) {
            if (keccak256(abi.encodePacked(candidates[i].name)) == keccak256(abi.encodePacked(_candidate))) {
                candidates[i].votes++;
            }
        }
    }

    function finishPoll() public restricted {
        emit EndPoll(candidates);
        delete candidates;
        pollStarted = false;
    }

    function startPoll(string[] memory _candidates) public restricted {
        for (uint i=0; i<_candidates.length; i++) {
            candidates.push(Candidate(_candidates[i], 0));
        }
        pollStarted = true;
    }

}