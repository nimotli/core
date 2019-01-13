const chai = require('chai');
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const sinon = require('sinon');
const { expect } = chai;

// Create a clean instance of ilorm :
const Ilorm = require('..').constructor;
const ilorm = new Ilorm();
const { Schema, newModel } = ilorm;

const connector = {
  queryFactory: ({ ParentQuery, }) => ParentQuery,
  modelFactory: ({ ParentModel, }) => ParentModel,
};

const schema = new Schema({
  firstName: Schema.string(),
  lastName: Schema.string(),
  age: Schema.number(),
});

const userModel = newModel({
  schema,
  connector,
});


describe('spec ilorm', () => {
  describe('Query', () => {
    it('Should use or operator to build query', async () => {
      const onOperator = sinon.spy();
      const onOperatorBranchA = sinon.spy();
      const onOperatorBranchB = sinon.spy();
      const onOr = ([ branchA, branchB ]) => {
        branchA.queryBuilder({ onOperator: onOperatorBranchA });
        branchB.queryBuilder({ onOperator: onOperatorBranchB });
      };
      connector.findOne = query => {
        query.queryBuilder({ onOperator, onOr, });
      };

      await userModel.query()
        .or(branch => {
          branch().firstName.is('Guillaume');
          branch().firstName.is('Tom');
        })
        .lastName.is('Daix')
        .findOne();

      expect(onOperatorBranchA).to.have.been.calledWith({ field: 'firstName', operator: 'is', value: 'Guillaume' });
      expect(onOperatorBranchB).to.have.been.calledWith({ field: 'firstName', operator: 'is', value: 'Tom' });
      expect(onOperator).to.have.been.calledWith({ field: 'lastName', operator: 'is', value: 'Daix' });
    });
  });
});