# POA Token Bridge / UI-E2E

End to end tests for the POA Token Bridge [UI](../UI/README.md).

- Configure startURL, homeAccount, foreignAccount in ```config.json```

## Running

To run the bridge end-to-end tests, you just have to run:

```
./run-tests.sh
```

#### Tests

```
1. User is able to open main page of bridge-ui 
2. Main page: foreign POA balance is displayed 
3. Main page: home POA balance is displayed

4. User is able to send tokens from Home account to Foreign account
5. Home POA balance has  correctly changed after transaction
6. Foreign account has received correct amount of tokens after transaction

7. User is able to send tokens from Foreign account to Home account
8. Foreign POA balance has correctly changed after transaction
9. Home account has received correct amount of tokens after transaction
```
